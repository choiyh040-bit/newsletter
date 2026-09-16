import GradientCenter from "@/components/templates/GradientCenter";
import SolidSerif from "@/components/templates/SolidSerif";
import type { BackgroundKind, Template } from "./types";

export * from "./types";

/**
 * 고를 수 있는 카드 템플릿.
 *
 * 새 디자인을 넣을 때는 `src/components/templates/` 에 컴포넌트를 만들고
 * 여기 배열에 한 줄 추가하면 된다. 다른 곳은 건드릴 필요가 없다.
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
];

export const DEFAULT_TEMPLATE_ID = TEMPLATES[0].id;

/** 모르는 id 가 들어와도 화면이 비지 않도록 기본값으로 떨어뜨린다. */
export function templateById(id: string | null | undefined): Template {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
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
