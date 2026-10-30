import DarkNeon from "@/components/templates/DarkNeon";
import GradientCenter from "@/components/templates/GradientCenter";
import DarkNeonSerif from "@/components/templates/DarkNeonSerif";
import PhotoStory from "@/components/templates/PhotoStory";
import CreamBold from "@/components/templates/CreamBold";
import PhotoFrame from "@/components/templates/PhotoFrame";
import PhotoCaption from "@/components/templates/PhotoCaption";
import HandNote from "@/components/templates/HandNote";
import DocPage from "@/components/templates/DocPage";
import DarkNumbered from "@/components/templates/DarkNumbered";
import type { BackgroundKind, Template, TemplateVariant } from "./types";
import { isHexColor } from "./color";
import {
  CAPTION_VARIANTS,
  CREAM_VARIANTS,
  DOC_VARIANTS,
  HAND_VARIANTS,
  LIGHT_VARIANTS,
  NEON_VARIANTS,
  NUMBERED_VARIANTS,
  PHOTO_VARIANTS,
} from "./variants";

export * from "./types";
export * from "./variants";

/**
 * 고를 수 있는 카드 템플릿.
 *
 * 새 디자인을 넣을 때는 `src/components/templates/` 에 컴포넌트를 만들고
 * 여기 배열에 한 줄 추가하면 된다. 다른 곳은 건드릴 필요가 없다.
 *
 * 레이아웃은 같고 색만 다른 것은 새 템플릿이 아니라 `variants` 다. 그렇게
 * 나누지 않으면 목록이 금세 색 견본으로 뒤덮인다.
 *
 * 배열의 첫 항목이 기본값이므로 순서가 의미를 갖는다.
 */
export const TEMPLATES: Template[] = [
  {
    id: "gradient-center",
    name: "그라데이션 · 고딕",
    description: "그라데이션 위 반투명 카드. 중앙 정렬",
    background: "color",
    font: "sans",
    Render: GradientCenter,
  },
  {
    // id 는 처음 만들 때(그라데이션 · 고딕에 사진을 깐 것) 그대로 둔다. 저장된
    // 결과가 이 id 로 열린다. 2026-10-16 참고 게시물에 맞춰 레이아웃을 새로 그렸다.
    id: "photo-gradient",
    name: "사진 · 반투명 카드",
    description: "장마다 다른 사진 위에 반투명 카드. 표지는 사진 위에 큰 제목",
    background: "photo",
    font: "sans",
    Render: PhotoStory,
    variants: PHOTO_VARIANTS,
  },
  {
    // 사용자가 보낸 참고 게시물("인스타 카드뉴스 성공하는 방법 vs 실패하는 방법")
    id: "cream-bold",
    name: "크림 바탕 · 굵은 고딕",
    description: "크림 바탕에 아주 굵은 검정 제목, 핵심어만 강조색. 중앙 정렬",
    background: "color",
    font: "sans",
    Render: CreamBold,
    variants: CREAM_VARIANTS,
  },
  // 2026-10-16 사용자가 보낸 참고 자료 네 묶음(docs/template-references.md 의 H)에서 하나씩.
  {
    id: "photo-frame",
    name: "흰 바탕 · 사진 상자",
    description: "흰 바탕에 둥근 사진을 크게 얹는다. 좌측 정렬",
    background: "photo",
    font: "sans",
    Render: PhotoFrame,
    variants: LIGHT_VARIANTS,
  },
  {
    id: "photo-caption",
    name: "사진 · 자막",
    description: "장마다 다른 사진에 상자 없이 자막처럼. 강조어만 한 색",
    background: "photo",
    font: "sans",
    Render: PhotoCaption,
    variants: CAPTION_VARIANTS,
  },
  {
    // 2026-10-30 사용자가 보낸 참고 게시물("웹사이트를 완성하는 8가지 프롬프트").
    id: "dark-numbered",
    name: "검정 · 번호 정리",
    description: "표지는 사진 아래 큰 제목, 상세는 큰 번호와 글 상자. 목록·팁 정리에",
    background: "photo",
    font: "sans",
    Render: DarkNumbered,
    variants: NUMBERED_VARIANTS,
    coverPhotoOnly: true,
  },
  {
    id: "hand-note",
    name: "손글씨 메모",
    description: "종이 위 손글씨, 형광펜과 빨간 펜. 중앙 정렬",
    background: "color",
    font: "hand",
    Render: HandNote,
    variants: HAND_VARIANTS,
  },
  {
    id: "doc-page",
    name: "문서 페이지",
    description: "흰 문서 한 쪽처럼. 굵은 제목, 구분선, 체크한 주제",
    background: "color",
    font: "sans",
    Render: DocPage,
    variants: DOC_VARIANTS,
  },
  {
    id: "dark-neon",
    name: "어두운 바탕 · 네온",
    description: "거의 검정 위에 형광 한 색. 좌측 정렬",
    background: "color",
    font: "sans",
    Render: DarkNeon,
    variants: NEON_VARIANTS,
    alignable: true,
  },
  {
    id: "dark-neon-serif",
    name: "어두운 바탕 · 네온 · 명조",
    description: "네온과 같은 구성에 서체만 명조",
    background: "color",
    font: "serif",
    Render: DarkNeonSerif,
    variants: NEON_VARIANTS,
    alignable: true,
  },
  {
    id: "light-accent",
    name: "흰 바탕 · 강조색",
    description: "흰 바탕에 강조색 한 색. 좌측 정렬",
    background: "color",
    font: "sans",
    // 레이아웃은 네온과 같다. 컴포넌트는 바탕 밝기를 보고 글자색을 뒤집는다.
    Render: DarkNeon,
    variants: LIGHT_VARIANTS,
    alignable: true,
  },
  {
    id: "light-accent-serif",
    name: "흰 바탕 · 강조색 · 명조",
    description: "흰 바탕 구성에 서체만 명조",
    background: "color",
    font: "serif",
    Render: DarkNeonSerif,
    variants: LIGHT_VARIANTS,
    alignable: true,
  },
];

/**
 * 목록에서 뺀 템플릿을 무엇으로 열지.
 *
 * `단색 · 명조`(solid-serif)를 뺐다(2026-10-15, 서체와 디자인이 아쉽다는
 * 판단). 그걸로 저장해 둔 결과는 명조라는 성격이 가장 가까운
 * `흰 바탕 · 강조색 · 명조` 로 연다. 기본값(그라데이션 · 고딕)으로 떨어뜨리면
 * 서체까지 바뀐다.
 */
const RETIRED: Record<string, string> = {
  "solid-serif": "light-accent-serif",
};

export const DEFAULT_TEMPLATE_ID = TEMPLATES[0].id;

/** 모르는 id 가 들어와도 화면이 비지 않도록 기본값으로 떨어뜨린다. */
export function templateById(id: string | null | undefined): Template {
  const resolved = (id && RETIRED[id]) || id;
  return TEMPLATES.find((t) => t.id === resolved) ?? TEMPLATES[0];
}

/**
 * 고른 색 조합. 색 조합이 없는 템플릿이면 null 이다.
 *
 * 모르는 id (다른 기기에서 저장했거나 목록에서 뺀 색)가 들어와도 첫 조합으로
 * 떨어뜨린다. 저장해 둔 결과가 색 하나 때문에 안 열리면 곤란하다.
 */
export function variantFor(
  template: Template,
  id: string | null | undefined
): TemplateVariant | null {
  const list = template.variants;
  if (!list || list.length === 0) return null;
  return list.find((v) => v.id === id) ?? list[0];
}

/**
 * 실제로 그릴 색. 고른 색 조합에 **사용자가 직접 고른 강조색**을 덮는다.
 *
 * 바탕은 색 조합에서 오고, 강조색만 바꾼다. 바탕까지 아무 색이나 고르게
 * 하면 "바탕 하나 + 튀는 색 하나"라는 이 템플릿들의 인상이 무너진다.
 * 직접 고른 색은 템플릿마다 따로 둔다. 검정 바탕에서 고른 형광 연두가 흰
 * 바탕으로 넘어오면 안 읽힌다.
 */
export function resolveColors(
  template: Template,
  variantId: string | null | undefined,
  customAccent: string | null | undefined
): TemplateVariant | null {
  const preset = variantFor(template, variantId);
  if (!preset || !isHexColor(customAccent)) return preset;
  return { ...preset, id: CUSTOM_VARIANT_ID, name: "직접 고른 색", neon: customAccent };
}

/** 직접 고른 강조색을 쓰는 중임을 나타내는 id. 색 조합 id 와 겹치지 않는다. */
export const CUSTOM_VARIANT_ID = "custom";

/** 사진이 있어야만 쓸 수 있는 템플릿인지. */
export function needsPhoto(template: Template): boolean {
  return template.background === "photo";
}

/**
 * 고를 수 있는 템플릿. **사진 템플릿도 늘 고를 수 있다.**
 *
 * 예전에는 사진이 있어야만 사진 템플릿을 보여 줬다. 이제 사진은 생성할 때
 * 자동으로 찾아 붙이고(`lib/photo.ts`), 못 찾으면 사진 템플릿이 그라데이션으로
 * 그린다. 그래서 거를 이유가 없다.
 */
export function availableTemplates(): Template[] {
  return TEMPLATES;
}

export const BACKGROUND_LABEL: Record<BackgroundKind, string> = {
  color: "색 배경",
  photo: "사진 배경",
};
