import type { ComponentType } from "react";
import type { CardNews, CardSlide } from "../cardnews";

/**
 * 카드 템플릿의 두 축.
 *
 * 디자인을 하나하나 별개로 두면 늘어날수록 관리가 안 된다. 실제로 갈리는
 * 지점은 "배경을 무엇으로 채우는가"와 "어떤 계열 글꼴을 쓰는가" 둘이라,
 * 그 둘을 축으로 두고 나머지는 템플릿 안에서 처리한다.
 */

/**
 * 배경을 무엇으로 채우는지.
 *
 * - `color`: 단색이나 그라데이션만 쓴다. 사진 없이 완결된다.
 * - `photo`: 사진 위에 글씨를 얹는다. 사진이 없으면 성립하지 않는다.
 *
 * 사진형은 글자에 테두리나 그늘을 넣는데, 그건 사진이 복잡해서 생긴 장치다.
 * 같은 처리를 단색 배경에 쓰면 근거 없이 요란해지므로 섞지 않는다.
 */
export type BackgroundKind = "color" | "photo";

/** 고딕은 원티드산스, 명조는 나눔명조를 쓴다. */
export type FontKind = "sans" | "serif";

export const FONT_STACK: Record<FontKind, string> = {
  sans: "'Wanted Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  serif: "'Nanum Myeongjo', serif",
};

/**
 * 한 템플릿 안에서 고를 수 있는 색 조합.
 *
 * "검정 + 핑크"와 "검정 + 형광 그린"은 서로 다른 디자인이 아니라 같은 디자인의
 * 다른 색이다. 이런 것까지 템플릿으로 하나씩 만들면 목록이 금세 색 견본으로
 * 뒤덮인다. 그래서 디자인(레이아웃)과 색을 따로 떼어, 색만 다른 것은 여기서
 * 고르게 한다.
 *
 * 새 조합을 넣는 일은 `variants.ts` 배열에 한 줄을 더하는 것이 전부다.
 */
export interface TemplateVariant {
  id: string;
  /** 선택 버튼에 보이는 이름 (예: "검정 · 핫핑크") */
  name: string;
  /** 카드 바탕색 (#rrggbb). 어두운 색이 아니어도 된다. */
  base: string;
  /** 포인트 한 색 (#rrggbb). 바탕 위에서 혼자 튀는 역할을 한다. */
  neon: string;
}

/**
 * 글 덩어리를 어느 쪽에 붙일지.
 *
 * 사진이 없는 카드에서는 정렬이 장식이 아니라 기능이다. 중앙 정렬은 줄마다
 * 왼쪽 끝이 움직여서, 서너 줄만 넘어가도 눈이 돌아올 지점을 잃는다. 그래서
 * **기본은 좌측**이고, 짧고 단정적인 세트에서만 사람이 중앙으로 바꾼다.
 *
 * 우측 정렬은 넣지 않았다. 한글에서 우측 정렬은 너무 센 제스처라 본문에
 * 쓰면 읽기가 확 나빠진다. 필요해지면 그때 한 줄짜리 전용으로 연다.
 */
export type TextAlign = "left" | "center";

export const DEFAULT_ALIGN: TextAlign = "left";

export const ALIGN_LABEL: Record<TextAlign, string> = {
  left: "좌측",
  center: "중앙",
};

/** 카드 한 장을 그릴 때 템플릿이 받는 값. */
export interface TemplateProps {
  slide: CardSlide;
  /** 세트 전체를 관통하는 포인트 컬러 (#rrggbb) */
  accent: string;
  total: number;
  source: CardNews["source"];
  /**
   * 배경 사진. `background`가 `"photo"`인 템플릿에서만 쓴다.
   * 아직 사진 파이프라인이 없어 항상 null 이다.
   */
  photo: TemplatePhoto | null;
  /**
   * 고른 색 조합. `variants` 를 가진 템플릿에서만 쓴다.
   * 색 조합이 없는 템플릿은 항상 null 이고 `accent` 만 본다.
   */
  variant: TemplateVariant | null;
  /** 글 정렬. `alignable` 이 아닌 템플릿은 무시한다. */
  align: TextAlign;
}

export interface TemplatePhoto {
  url: string;
  /** 출처를 모르는 사진은 쓰지 않는다. 그래서 필수 항목이다. */
  credit: string;
}

export interface Template {
  id: string;
  /** 화면의 선택 버튼에 보이는 이름 */
  name: string;
  /** 어떤 느낌인지 한 줄 */
  description: string;
  background: BackgroundKind;
  font: FontKind;
  Render: ComponentType<TemplateProps>;
  /**
   * 고를 수 있는 색 조합. 없으면 기사에서 뽑은 `accent` 를 그대로 쓴다는 뜻이다.
   * 첫 항목이 기본값이므로 순서가 의미를 갖는다.
   */
  variants?: readonly TemplateVariant[];
  /**
   * 정렬을 고를 수 있는 템플릿인지.
   *
   * 모든 템플릿에 열지 않는다. `GradientCenter` 는 중앙이, `SolidSerif` 는
   * 좌측 상단이 그 디자인의 정체성이라, 바꾸면 다른 템플릿이 되어 버린다.
   */
  alignable?: boolean;
}
