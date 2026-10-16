/**
 * 글의 말투. 처음에는 MICE 공공기관 뉴스 전용이라 말투가 하나(담담한 뉴스체,
 * 홍보 문구 금지)였다. 다른 분야에도 쓰려면 홍보 말투가 자연스러운 곳(맛집,
 * 뷰티, 행사 모집)이 있어서 고르게 했다(2026-10-16, 사용자 결정).
 *
 * 말투가 바꾸는 것은 문장 끝과 권유를 허용하는 정도뿐이다. **사실 규칙(자료에
 * 없는 사실·과장 금지)은 어느 말투에서도 같다.** 생성 프롬프트(`/api/generate`)가
 * 말투마다 문장 규칙을 바꾼다.
 */
export const TONES = [
  { id: "news", name: "뉴스형", hint: "담담한 기사체. 기관·업계 소식에" },
  { id: "info", name: "정보형", hint: "친근한 설명체. 꿀팁·정리 글에" },
  { id: "promo", name: "홍보형", hint: "말 거는 말투, 참여 권유. 행사·가게·제품에" },
] as const;

export type ToneId = (typeof TONES)[number]["id"];

export const DEFAULT_TONE: ToneId = "news";

export function isTone(value: unknown): value is ToneId {
  return TONES.some((t) => t.id === value);
}
