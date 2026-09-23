import type { TemplateVariant } from "./types";

/**
 * 어두운 바탕 + 네온 한 색 템플릿의 색 조합.
 *
 * **새 조합은 이 배열에 한 줄만 더하면 된다.** 컴포넌트는 `base` 와 `neon`
 * 두 값만 보고 나머지(글자색, 글로우, 격자, 선)를 스스로 계산한다.
 *
 * 색을 고를 때의 기준:
 *
 * - `base` 는 거의 무채색에 가깝게 둔다. 바탕이 색을 띠기 시작하면 포인트
 *   컬러와 싸워서 "한 색만 쓴다"는 인상이 깨진다. 남색처럼 확실히 다른
 *   계열로 갈 거라면 차라리 충분히 멀리 보낸다.
 * - `neon` 은 채도를 끝까지 올린다. 바탕이 어두울수록 어중간한 채도는
 *   그냥 탁한 회색으로 읽힌다.
 * - 밝은 바탕도 된다. 글자색은 `inkFor` 가 바탕 밝기를 보고 뒤집는다.
 */
export const NEON_VARIANTS: readonly TemplateVariant[] = [
  { id: "black-pink", name: "검정 · 핫핑크", base: "#0A0A0C", neon: "#FF2D78" },
  { id: "black-lime", name: "검정 · 형광 그린", base: "#0A0C0A", neon: "#B8FF2E" },
  { id: "black-orange", name: "검정 · 형광 주황", base: "#0C0A08", neon: "#FF7A18" },
  { id: "black-cyan", name: "검정 · 시안", base: "#080B0D", neon: "#25E0F0" },
  { id: "black-violet", name: "검정 · 바이올렛", base: "#0B0A0F", neon: "#9B5CFF" },
  { id: "navy-yellow", name: "남색 · 노랑", base: "#0B1026", neon: "#FFD400" },
  { id: "ivory-crimson", name: "아이보리 · 진홍", base: "#F3F0E8", neon: "#D81E3C" },
];
