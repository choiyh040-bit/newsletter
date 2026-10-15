import DarkNeon from "@/components/templates/DarkNeon";
import GradientCenter from "@/components/templates/GradientCenter";
import SolidSerif from "@/components/templates/SolidSerif";
import type { BackgroundKind, Template, TemplateVariant } from "./types";
import { isHexColor } from "./color";
import { LIGHT_VARIANTS, NEON_VARIANTS } from "./variants";

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
    id: "solid-serif",
    name: "단색 · 명조",
    description: "단색 배경에 글을 바로. 좌측 상단 정렬",
    background: "color",
    font: "serif",
    Render: SolidSerif,
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
];

export const DEFAULT_TEMPLATE_ID = TEMPLATES[0].id;

/** 모르는 id 가 들어와도 화면이 비지 않도록 기본값으로 떨어뜨린다. */
export function templateById(id: string | null | undefined): Template {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
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

/** 지금 쓸 수 있는 것만. 사진 파이프라인이 붙기 전까지는 색 배경만 고를 수 있다. */
export function availableTemplates(hasPhoto: boolean): Template[] {
  return TEMPLATES.filter((t) => hasPhoto || t.background === "color");
}

export const BACKGROUND_LABEL: Record<BackgroundKind, string> = {
  color: "색 배경",
  photo: "사진 배경",
};
