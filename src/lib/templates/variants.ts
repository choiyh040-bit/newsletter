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
];

/**
 * 흰 바탕 + 강조색 한 색. 레이아웃은 네온과 같다(같은 컴포넌트).
 *
 * 처음에는 네온의 색 조합 하나(`ivory-crimson`)로 들어 있었다. 이름이
 * "어두운 바탕"인 템플릿 안에 흰 바탕이 숨어 있으면 찾을 수 없어서 따로
 * 뺐다. 강조색은 흰 바탕에서 글자로도 읽히는 진한 색으로 고른다. 형광
 * 채도는 흰 바탕에서 오히려 번져 보인다.
 */
export const LIGHT_VARIANTS: readonly TemplateVariant[] = [
  { id: "white-crimson", name: "흰색 · 진홍", base: "#FFFFFF", neon: "#D81E3C" },
  { id: "white-blue", name: "흰색 · 파랑", base: "#FFFFFF", neon: "#1F4FE0" },
  { id: "white-green", name: "흰색 · 진녹", base: "#FFFFFF", neon: "#0E8A5F" },
  { id: "white-orange", name: "흰색 · 주황", base: "#FFFFFF", neon: "#F05A16" },
  { id: "white-violet", name: "흰색 · 보라", base: "#FFFFFF", neon: "#6B3FD4" },
  { id: "ivory-crimson", name: "아이보리 · 진홍", base: "#F3F0E8", neon: "#D81E3C" },
];

/**
 * 사진 · 반투명 카드의 강조색. 사진 위 어두운 상자에서 읽히는 밝은 색들.
 * `base` 는 견본 동그라미의 바탕(상자 색)일 뿐 카드 배경은 사진이다.
 * 참고 게시물이 노랑(서울썸머비치)·민트(표지)를 썼다.
 */
export const PHOTO_VARIANTS: readonly TemplateVariant[] = [
  { id: "photo-yellow", name: "노랑", base: "#1A1C21", neon: "#FFD54A" },
  { id: "photo-mint", name: "민트", base: "#1A1C21", neon: "#7EF0C8" },
  { id: "photo-sky", name: "하늘", base: "#1A1C21", neon: "#7CC8FF" },
  { id: "photo-pink", name: "분홍", base: "#1A1C21", neon: "#FF8FB8" },
  { id: "photo-white", name: "흰색", base: "#1A1C21", neon: "#FFFFFF" },
];

/**
 * 크림 바탕 · 굵은 고딕의 강조색. 바탕은 참고 게시물의 크림색으로 고정하고
 * 강조색만 바꾼다. 크림 위에서 글자로 읽히는 진한 색들.
 */
export const CREAM_VARIANTS: readonly TemplateVariant[] = [
  { id: "cream-red", name: "크림 · 빨강", base: "#F3EEE4", neon: "#D7262B" },
  { id: "cream-blue", name: "크림 · 파랑", base: "#F3EEE4", neon: "#1F4FE0" },
  { id: "cream-green", name: "크림 · 진녹", base: "#F3EEE4", neon: "#0E8A5F" },
  { id: "cream-orange", name: "크림 · 주황", base: "#F3EEE4", neon: "#E8590C" },
  { id: "cream-violet", name: "크림 · 보라", base: "#F3EEE4", neon: "#6B3FD4" },
];

/**
 * 사진 · 자막의 강조색. 제목은 흰색이고 강조어만 이 색이다. 참고 게시물이 쓴
 * 분홍·노랑·형광 연두·민트에 흰색(강조 없이 담백하게)을 더했다.
 * `base` 는 견본 동그라미의 바탕일 뿐 카드 배경은 사진이다.
 */
/**
 * 검정 · 번호 정리의 강조색. 참고 게시물은 검정에 분홍이었다. 바탕은 거의 검정 하나.
 */
export const NUMBERED_VARIANTS: readonly TemplateVariant[] = [
  { id: "numbered-pink", name: "분홍", base: "#0E0E10", neon: "#F0508C" },
  { id: "numbered-blue", name: "파랑", base: "#0E0E10", neon: "#5B9BFF" },
  { id: "numbered-lime", name: "형광 연두", base: "#0E0E10", neon: "#B5FF5A" },
  { id: "numbered-orange", name: "주황", base: "#0E0E10", neon: "#FF8A3D" },
  { id: "numbered-violet", name: "보라", base: "#0E0E10", neon: "#A78BFA" },
];

export const CAPTION_VARIANTS: readonly TemplateVariant[] = [
  { id: "caption-yellow", name: "노랑", base: "#2A2A2A", neon: "#FFE873" },
  { id: "caption-pink", name: "분홍", base: "#2A2A2A", neon: "#FFB3DA" },
  { id: "caption-lime", name: "형광 연두", base: "#2A2A2A", neon: "#B5FF5A" },
  { id: "caption-mint", name: "민트", base: "#2A2A2A", neon: "#6EF0C2" },
  { id: "caption-white", name: "흰색", base: "#2A2A2A", neon: "#FFFFFF" },
];

/**
 * 손글씨 메모의 종이색(`base`)과 형광펜 색(`neon`). 참고 게시물은 노란 메모지와
 * 크림 종이였다. 강조어 빨간 펜은 색 조합과 상관없이 고정이다.
 */
export const HAND_VARIANTS: readonly TemplateVariant[] = [
  { id: "hand-yellow", name: "노란 메모지", base: "#FBE59A", neon: "#F7B731" },
  { id: "hand-cream", name: "크림 종이", base: "#FBF5EA", neon: "#FFD34D" },
  { id: "hand-sky", name: "하늘 종이", base: "#E4F0FA", neon: "#8CC4F2" },
  { id: "hand-pink", name: "분홍 종이", base: "#FCE8EC", neon: "#F7A3B8" },
  { id: "hand-mint", name: "민트 종이", base: "#E3F4EA", neon: "#88D8B0" },
];

/**
 * 문서 페이지의 강조색. 바탕(`base`)은 종이 바깥의 연회색이고 종이는 흰색이다.
 * 문서 도구들이 쓰는 차분한 색 쪽으로 골랐다.
 */
export const DOC_VARIANTS: readonly TemplateVariant[] = [
  { id: "doc-blue", name: "파랑", base: "#F1F0EC", neon: "#2F80ED" },
  { id: "doc-green", name: "초록", base: "#F1F0EC", neon: "#0F8A6C" },
  { id: "doc-orange", name: "주황", base: "#F1F0EC", neon: "#E0761A" },
  { id: "doc-red", name: "빨강", base: "#F1F0EC", neon: "#E03E3E" },
  { id: "doc-purple", name: "보라", base: "#F1F0EC", neon: "#8A56C2" },
];
