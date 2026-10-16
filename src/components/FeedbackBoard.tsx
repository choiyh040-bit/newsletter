"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * 피드백 게시판 화면. 글쓰기와 목록. 서버는 `/api/feedback`(GitHub 이슈에 저장).
 * 분류·글자 수 제한은 `lib/feedback.ts` 와 같아야 한다(서버가 다시 검사한다).
 */
const CATEGORIES = [
  { id: "bug", name: "오류" },
  { id: "idea", name: "제안" },
  { id: "praise", name: "칭찬" },
  { id: "etc", name: "기타" },
] as const;
type CategoryId = (typeof CATEGORIES)[number]["id"];

interface Post {
  number: number;
  category: CategoryId;
  nickname: string;
  body: string;
  createdAt: string;
  replies: { body: string; createdAt: string }[];
}

interface Loaded {
  state: "ready" | "off" | "error";
  posts: Post[];
}

async function fetchPosts(): Promise<Loaded> {
  try {
    const res = await fetch("/api/feedback", { cache: "no-store" });
    const data = (await res.json()) as { enabled: boolean; posts?: Post[] };
    if (!data.enabled) return { state: "off", posts: [] };
    return { state: res.ok ? "ready" : "error", posts: data.posts ?? [] };
  } catch {
    return { state: "error", posts: [] };
  }
}

function when(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
}

export default function FeedbackBoard() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "off" | "error">("loading");
  const [category, setCategory] = useState<CategoryId>("idea");
  const [nickname, setNickname] = useState("");
  const [body, setBody] = useState("");
  const [website, setWebsite] = useState(""); // 자동 프로그램 덫. 사람에게는 안 보인다.
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const apply = useCallback((r: Loaded) => {
    setState(r.state);
    setPosts(r.posts);
  }, []);

  useEffect(() => {
    let alive = true;
    void fetchPosts().then((r) => alive && apply(r));
    return () => {
      alive = false;
    };
  }, [apply]);

  const submit = async () => {
    if (sending) return;
    setSending(true);
    setMessage(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, nickname, body, website }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; post?: Post };
      if (!res.ok || !data.ok) {
        setMessage({ ok: false, text: data.error ?? "글을 올리지 못했습니다." });
        return;
      }
      setBody("");
      setMessage({ ok: true, text: "고맙습니다. 글이 올라갔습니다." });
      // 목록을 새로 받되, 방금 쓴 글은 늘 맨 위에 둔다. 다른 서버가 1분 기억해 둔 목록에는
      // 아직 없을 수 있다.
      const fresh = await fetchPosts();
      const mine = data.post;
      apply(
        mine && !fresh.posts.some((p) => p.number === mine.number)
          ? { state: fresh.state === "error" ? "ready" : fresh.state, posts: [mine, ...fresh.posts] }
          : fresh
      );
    } catch {
      setMessage({ ok: false, text: "글을 올리지 못했습니다. 잠시 후 다시 시도해 주세요." });
    } finally {
      setSending(false);
    }
  };

  const length = body.trim().length;

  return (
    <div>
      {/* 글쓰기 */}
      <section className="glass-panel p-5 md:p-6 border border-white/8 mb-10" aria-label="글쓰기">
        <div className="flex flex-wrap gap-2 mb-4" role="radiogroup" aria-label="분류">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={category === c.id}
              onClick={() => setCategory(c.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-korean-bold border transition-colors ${
                category === c.id ? "border-primary/70 bg-primary/15 text-white" : "border-white/12 text-white/55"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={20}
          placeholder="별명 (안 쓰면 익명)"
          aria-label="별명"
          className="w-full mb-3 bg-white/5 border border-white/12 px-3 py-2 text-sm text-white placeholder-white/30"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={1000}
          rows={5}
          placeholder="내용을 적어 주세요 (5~1000자)"
          aria-label="내용"
          className="w-full bg-white/5 border border-white/12 px-3 py-2 text-sm text-white placeholder-white/30 leading-relaxed"
        />
        {/* 사람에게는 안 보이는 칸. 자동 프로그램만 채운다. */}
        <input
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          name="website"
          style={{ position: "absolute", left: -9999, width: 1, height: 1, opacity: 0 }}
        />
        <div className="flex items-center justify-between gap-3 mt-3">
          <p className="text-white/35 text-xs leading-relaxed">
            글은 모두에게 공개됩니다. 이름·연락처 같은 개인정보는 쓰지 마세요.
          </p>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={sending || length < 5 || state === "off"}
            className="cta-gradient text-white px-5 py-2 rounded-lg text-sm font-korean-bold whitespace-nowrap disabled:opacity-40"
          >
            {sending ? "올리는 중…" : "올리기"}
          </button>
        </div>
        <p className="text-white/30 text-xs mt-1 text-right tabular-nums">{length}/1000</p>
        {message && (
          <p className={`text-sm mt-2 ${message.ok ? "text-primary" : "text-red-400"}`} role="status">
            {message.text}
          </p>
        )}
      </section>

      {/* 목록 */}
      <section aria-label="글 목록">
        {state === "loading" && <p className="text-white/40 text-sm">불러오는 중…</p>}
        {state === "off" && <p className="text-white/50 text-sm">게시판을 준비하고 있습니다. 곧 열립니다.</p>}
        {state === "error" && <p className="text-red-400 text-sm">글 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>}
        {state === "ready" && posts.length === 0 && <p className="text-white/50 text-sm">아직 글이 없습니다. 첫 글을 남겨 주세요.</p>}
        <ul className="space-y-4" style={{ listStyle: "none", paddingLeft: 0 }}>
          {posts.map((p) => (
            <li key={p.number} className="glass-panel p-5 border border-white/8" data-post={p.number}>
              <div className="flex items-center gap-2 text-xs mb-2">
                <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary font-korean-bold">
                  {CATEGORIES.find((c) => c.id === p.category)?.name ?? "기타"}
                </span>
                <span className="text-white/70 font-korean-bold">{p.nickname}</span>
                <span className="text-white/30">{when(p.createdAt)}</span>
              </div>
              <p className="text-white/80 text-[15px] leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">{p.body}</p>
              {p.replies.map((r, i) => (
                <div key={i} className="mt-3 pl-3 border-l-2 border-primary/50">
                  <p className="text-primary text-xs font-korean-bold mb-1">운영자 답변 · {when(r.createdAt)}</p>
                  <p className="text-white/75 text-sm leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">{r.body}</p>
                </div>
              ))}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
