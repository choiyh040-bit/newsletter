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
}
