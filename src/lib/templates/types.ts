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
}
