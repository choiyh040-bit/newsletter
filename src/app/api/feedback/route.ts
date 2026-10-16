import { createHash } from "node:crypto";
import {
  BODY_MAX,
  FEEDBACK_LABEL,
  NICKNAME_MAX,
  feedbackConfig,
  fromIssue,
  isCategory,
  toIssue,
  validate,
  type FeedbackPost,
} from "@/lib/feedback";

/**
 * 피드백 게시판. GET 은 목록, POST 는 새 글. 저장은 GitHub 이슈(`lib/feedback.ts`).
 *
 * 목록은 1분 동안 기억한다. 방문자마다 GitHub 를 부르면 사용량 한도(시간당 5,000회)를
 * 금방 쓴다. 새 글을 쓰면 바로 비운다.
 */

// 목록을 빌드할 때 굳히지 않는다(버전마다 기본값이 달랐다). 기억은 아래 1분 캐시가 맡는다.
export const dynamic = "force-dynamic";

interface GitHubIssue {
  number: number;
  body?: string | null;
  created_at: string;
  comments: number;
  pull_request?: unknown;
}

interface GitHubComment {
  body?: string | null;
  created_at: string;
  author_association?: string;
}

const LIST_SIZE = 30;
const CACHE_MS = 60_000;
let cache: { at: number; posts: FeedbackPost[] } | null = null;

/** 같은 곳에서 연달아 쓰는 것을 막는다. IP 는 저장하지 않고 해시로만, 이 서버 메모리에만 잠깐. */
const WINDOW_MS = 10 * 60_000;
const WINDOW_MAX = 3;
const recent = new Map<string, number[]>();

function gh(path: string, init?: RequestInit) {
  const { api, token } = feedbackConfig();
  return fetch(`${api}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
    signal: AbortSignal.timeout(10_000),
  });
}

async function loadPosts(): Promise<FeedbackPost[]> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.posts;
  const { repo } = feedbackConfig();
  const res = await gh(
    `/repos/${repo}/issues?state=open&labels=${FEEDBACK_LABEL}&sort=created&direction=desc&per_page=${LIST_SIZE}`
  );
  if (!res.ok) throw new Error(`GitHub ${res.status}`);
  const issues = ((await res.json()) as GitHubIssue[]).filter((i) => !i.pull_request);

  // 댓글이 있는 글만 댓글을 부른다. 운영자(저장소 주인)가 쓴 것만 답변으로 보인다.
  const posts = await Promise.all(
    issues.map(async (issue): Promise<FeedbackPost> => {
      let replies: FeedbackPost["replies"] = [];
      if (issue.comments > 0) {
        const r = await gh(`/repos/${repo}/issues/${issue.number}/comments?per_page=20`);
        if (r.ok) {
          replies = ((await r.json()) as GitHubComment[])
            .filter((c) => c.author_association === "OWNER")
            .map((c) => ({ body: (c.body ?? "").trim(), createdAt: c.created_at }));
        }
      }
      return { ...fromIssue(issue), replies };
    })
  );
  cache = { at: Date.now(), posts };
  return posts;
}

export async function GET() {
  if (!feedbackConfig().enabled) return Response.json({ enabled: false, posts: [] });
  try {
    return Response.json({ enabled: true, posts: await loadPosts() });
  } catch (error) {
    console.warn("[feedback] 목록을 못 받았습니다:", error);
    return Response.json({ enabled: true, posts: [], error: "글 목록을 불러오지 못했습니다." }, { status: 502 });
  }
}

export async function POST(request: Request) {
  if (!feedbackConfig().enabled) {
    return Response.json({ error: "게시판이 아직 준비되지 않았습니다." }, { status: 503 });
  }
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "요청을 읽을 수 없습니다." }, { status: 400 });
  }

  // 사람 눈에 안 보이는 칸. 채워져 있으면 자동 프로그램이다. 성공처럼 답하고 버린다.
  if (typeof body.website === "string" && body.website.trim()) return Response.json({ ok: true });

  const category = isCategory(body.category) ? body.category : "etc";
  const nickname = typeof body.nickname === "string" ? body.nickname.trim().slice(0, NICKNAME_MAX + 1) : "";
  const text = typeof body.body === "string" ? body.body.trim().slice(0, BODY_MAX + 1) : "";
  const problem = validate(nickname, text);
  if (problem) return Response.json({ error: problem }, { status: 400 });

  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  const key = createHash("sha256").update(ip).digest("hex").slice(0, 16);
  const now = Date.now();
  const mine = (recent.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (mine.length >= WINDOW_MAX) {
    return Response.json({ error: "잠시 후 다시 써 주세요. 10분에 세 번까지 쓸 수 있습니다." }, { status: 429 });
  }

  const { repo } = feedbackConfig();
  let created: GitHubIssue;
  try {
    const res = await gh(`/repos/${repo}/issues`, {
      method: "POST",
      body: JSON.stringify(toIssue(category, nickname, text)),
    });
    if (!res.ok) throw new Error(`GitHub ${res.status} ${await res.text().catch(() => "")}`.slice(0, 300));
    created = (await res.json()) as GitHubIssue;
  } catch (error) {
    console.warn("[feedback] 글을 저장하지 못했습니다:", error);
    return Response.json({ error: "글을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요." }, { status: 502 });
  }

  recent.set(key, [...mine, now]);
  cache = null;
  // 방금 쓴 글을 돌려준다. 화면이 목록 맨 위에 바로 넣는다. 서버가 여러 대라 다른 서버의
  // 1분 기억에서 목록을 받으면 방금 쓴 글이 빠져 보였다(2026-10-16 배포 시험에서 발견).
  const post: FeedbackPost = { ...fromIssue(created), replies: [] };
  return Response.json({ ok: true, post });
}
