/**
 * 글의 말투. 처음에는 MICE 공공기관 뉴스 전용이라 말투가 하나(담담한 뉴스체,
 * 홍보 문구 금지)였다. 다른 분야에도 쓰려면 홍보 말투가 자연스러운 곳(맛집,
 * 뷰티, 행사 모집)이 있어서 고르게 했다(2026-10-16, 사용자 결정).
 *
 * 넷째인 감성형은 패션처럼 반말 구어체가 맛인 분야를 위해 더했다.
 *
 * 말투가 바꾸는 것은 문장 끝과 권유를 허용하는 정도뿐이다. **사실 규칙(자료에
 * 없는 사실·과장 금지)은 어느 말투에서도 같다.** 생성 프롬프트(`/api/generate`)가
 * 말투마다 문장 규칙을 바꾼다.
 */
export const TONES = [
  { id: "news", name: "뉴스형", hint: "담담한 기사체. 기관·업계 소식에" },
  { id: "info", name: "정보형", hint: "친근한 설명체. 꿀팁·정리 글에" },
  { id: "promo", name: "홍보형", hint: "말 거는 말투, 참여 권유. 행사·가게·제품에" },
  // 패션 릴스(참고 자료 3번)처럼 반말·구어체로 툭 던지는 SNS 말투. 패션을 따로
  // 만들지 않고 말투 하나로 풀었다 — 뷰티·카페·여행에도 같은 말투가 쓰인다(2026-10-16).
  { id: "mood", name: "감성형", hint: "반말·구어체 SNS 말투. 패션·뷰티·카페에" },
] as const;

export type ToneId = (typeof TONES)[number]["id"];

export const DEFAULT_TONE: ToneId = "news";

export function isTone(value: unknown): value is ToneId {
  return TONES.some((t) => t.id === value);
}
