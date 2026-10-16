/**
 * 익명 피드백 게시판. 글은 **GitHub 이슈**로 저장한다(2026-10-16, 사용자 결정).
 *
 * 왜 GitHub 이슈인가: DB 를 따로 두지 않아도 되고, 운영자가 GitHub 앱에서 글을 보고
 * **닫으면 사이트에서 사라지고, 댓글을 달면 "운영자 답변"으로 보인다.** 관리 화면을
 * 따로 만들 필요가 없다.
 *
 * - 글쓴이는 가입하지 않는다. 사이트가 운영자의 토큰(`FEEDBACK_GITHUB_TOKEN`)으로 대신
 *   이슈를 만든다. 그래서 GitHub 에는 모두 운영자 계정이 쓴 것으로 남는다.
 * - 저장소는 공개라 글은 GitHub 에서도 보인다. 공개 게시판이니 괜찮다.
 * - 게시판 글은 `feedback` 표시(label)가 붙은 **열린** 이슈만이다.
 *
 * 이 파일은 서버에서만 쓴다(토큰을 다룬다).
 */

export const FEEDBACK_CATEGORIES = [
  { id: "bug", name: "오류" },
  { id: "idea", name: "제안" },
  { id: "praise", name: "칭찬" },
  { id: "etc", name: "기타" },
] as const;
export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number]["id"];

export const FEEDBACK_LABEL = "feedback";
export const NICKNAME_MAX = 20;
export const BODY_MIN = 5;
export const BODY_MAX = 1000;
const LINK_MAX = 2;

export interface FeedbackPost {
  number: number;
  category: FeedbackCategory;
  nickname: string;
  body: string;
  createdAt: string;
  /** 운영자(저장소 주인)가 단 댓글. */
  replies: { body: string; createdAt: string }[];
}

export function feedbackConfig() {
  const token = process.env.FEEDBACK_GITHUB_TOKEN?.trim() ?? "";
  const repo = process.env.FEEDBACK_REPO?.trim() || "choiyh040-bit/newsletter";
  const api = (process.env.GITHUB_API_URL?.trim() || "https://api.github.com").replace(/\/$/, "");
  return { token, repo, api, enabled: Boolean(token) && /^[\w.-]+\/[\w.-]+$/.test(repo) };
}

export function isCategory(v: unknown): v is FeedbackCategory {
  return FEEDBACK_CATEGORIES.some((c) => c.id === v);
}

/**
 * 글 검사. 문제가 있으면 사람에게 보여 줄 문구를, 없으면 null.
 * 광고 글은 대개 링크를 여러 개 단다. 링크는 두 개까지만 받는다.
 */
export function validate(nickname: string, body: string): string | null {
  if (nickname.length > NICKNAME_MAX) return `별명은 ${NICKNAME_MAX}자까지입니다.`;
  if (body.length < BODY_MIN) return `내용을 ${BODY_MIN}자 이상 적어 주세요.`;
  if (body.length > BODY_MAX) return `내용은 ${BODY_MAX}자까지입니다.`;
  if ((body.match(/https?:\/\//gi) ?? []).length > LINK_MAX) return `링크는 ${LINK_MAX}개까지만 넣을 수 있습니다.`;
  return null;
}

/**
 * GitHub 에서 엉뚱한 사람에게 알림이 가지 않게 `@아이디` 를 무력화한다(골뱅이 뒤에
 * 폭 없는 공백). 사이트에 보일 때는 그대로 읽힌다.
 */
function defang(text: string): string {
  return text.replace(/@(?=[A-Za-z0-9-])/g, "@​");
}

const META = /^<!-- feedback:v1 (\{.*?\}) -->\n?/;

/** 이슈 본문 = 숨은 머리말(분류·별명) + 글. 머리말은 GitHub 화면에 안 보인다. */
export function toIssue(category: FeedbackCategory, nickname: string, body: string) {
  const name = FEEDBACK_CATEGORIES.find((c) => c.id === category)?.name ?? "기타";
  const oneLine = body.replace(/\s+/g, " ").trim();
  return {
    title: `[${name}] ${defang(oneLine.slice(0, 40))}${oneLine.length > 40 ? "…" : ""}`,
    body: `<!-- feedback:v1 ${JSON.stringify({ category, nickname })} -->\n${defang(body)}`,
    labels: [FEEDBACK_LABEL],
  };
}

export function fromIssue(issue: {
  number: number;
  body?: string | null;
  created_at: string;
}): Omit<FeedbackPost, "replies"> {
  const raw = issue.body ?? "";
  const m = raw.match(META);
  let category: FeedbackCategory = "etc";
  let nickname = "";
  if (m) {
    try {
      const meta = JSON.parse(m[1]) as { category?: unknown; nickname?: unknown };
      if (isCategory(meta.category)) category = meta.category;
      if (typeof meta.nickname === "string") nickname = meta.nickname.slice(0, NICKNAME_MAX);
    } catch {
      // 머리말이 깨졌으면 기타·익명으로 보여 준다.
    }
  }
  return {
    number: issue.number,
    category,
    nickname: nickname || "익명",
    body: raw.replace(META, "").replace(/@​/g, "@").trim(),
    createdAt: issue.created_at,
  };
}
