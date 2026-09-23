import DarkNeon from "@/components/templates/DarkNeon";
import GradientCenter from "@/components/templates/GradientCenter";
import SolidSerif from "@/components/templates/SolidSerif";
import type { BackgroundKind, Template, TemplateVariant } from "./types";
import { NEON_VARIANTS } from "./variants";

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
