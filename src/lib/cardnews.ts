/**
 * 카드뉴스 규격과 데이터 형태.
 *
 * 인스타그램 세로 카드(4:5) 기준으로 고정한다. 렌더링 크기를 한 곳에서만
 * 정의해서 미리보기와 PNG 내보내기가 같은 값을 쓰도록 한다.
 */

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1350;

/** 슬라이드 장수 범위. 표지 1장 + 상세 3~4장. */
export const MIN_SLIDES = 4;
export const MAX_SLIDES = 5;

/** 포인트 컬러를 못 고르거나 형식이 틀렸을 때 쓰는 기본값. */
export const DEFAULT_ACCENT = "#0f5b8c";

export type SlideKind = "cover" | "detail" | "outro";

export interface CardSlide {
  slideNumber: number;
  kind: SlideKind;
  /** 좌상단 배지 문구 (예: "MICE 뉴스") */
  badge: string;
  /** 표지에서 헤드라인 위에 작게 붙는 한 줄. 표지가 아니면 비어 있을 수 있다. */
  sub: string;
  /**
   * 헤드라인. 한 원소가 화면의 한 줄이 된다.
   *
   * 자동 줄바꿈에 맡기지 않고 의미 단위로 미리 끊어서 받는다. 브라우저의
   * 한글 어절 단위 줄바꿈이 일정하지 않아 "~습니다" 같은 서술어 앞에서
   * 줄이 끊기는 일이 잦기 때문이다.
   */
  heading: string[];
  /** 본문. heading과 같은 규칙으로 한 원소가 한 줄이다. */
  body: string[];
}

export interface CardNewsSource {
  name: string;
  url: string;
}

export interface CardNews {
  title: string;
  /** 세트 전체를 관통하는 포인트 컬러 (#rrggbb) */
  accent: string;
  slides: CardSlide[];
  caption: string;
  hashtags: string[];
  source: CardNewsSource | null;
}

export interface CardNewsMeta {
  keyword: string;
  createdAt: string;
}

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

/** 문자열이든 배열이든 받아서 "한 원소 = 한 줄" 배열로 만든다. */
function toLines(value: unknown, maxLines: number): string[] {
  const raw = Array.isArray(value) ? value : [value];
  return raw
    .flatMap((line) =>
      typeof line === "string" ? line.split(/<br\s*\/?>|\n/) : []
    )
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, maxLines);
}

function toText(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function slideKind(index: number, total: number): SlideKind {
  if (index === 0) return "cover";
  if (index === total - 1) return "outro";
  return "detail";
}

/**
 * 모델이 돌려준 값을 화면에 그려도 되는 형태로 정리한다.
 *
 * 모델 출력은 신뢰할 수 없으므로 필드가 빠지거나 타입이 달라도 여기서
 * 흡수하고, 그릴 수 없는 수준이면 예외를 던져 호출부가 재시도하게 한다.
 */
export function normalizeCardNews(raw: unknown): CardNews {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("응답이 객체가 아닙니다.");
  }
  const input = raw as Record<string, unknown>;

  const rawSlides = Array.isArray(input.slides) ? input.slides : [];
  if (rawSlides.length === 0) {
    throw new Error("슬라이드가 비어 있습니다.");
  }

  const trimmed = rawSlides.slice(0, MAX_SLIDES);
  const slides: CardSlide[] = trimmed.map((entry, i) => {
    const slide = (typeof entry === "object" && entry !== null ? entry : {}) as Record<string, unknown>;
    const kind = slideKind(i, trimmed.length);
    return {
      slideNumber: i + 1,
      kind,
      badge: toText(slide.badge, "뉴스"),
      sub: toText(slide.sub),
      heading: toLines(slide.heading, kind === "cover" ? 3 : 2),
      body: toLines(slide.body, kind === "cover" ? 2 : 4),
    };
  });

  // 헤드라인이 하나도 없는 슬라이드가 있으면 카드로 쓸 수 없다.
  if (slides.some((slide) => slide.heading.length === 0)) {
    throw new Error("헤드라인이 없는 슬라이드가 있습니다.");
  }

  const accent = toText(input.accent);
  const sourceRaw = input.source;
  const source =
    typeof sourceRaw === "object" && sourceRaw !== null
      ? {
          name: toText((sourceRaw as Record<string, unknown>).name),
          url: toText((sourceRaw as Record<string, unknown>).url),
        }
      : null;

  return {
    title: toText(input.title, slides[0].heading.join(" ")),
    accent: HEX_COLOR.test(accent) ? accent : DEFAULT_ACCENT,
    slides,
    caption: toText(input.caption),
    hashtags: Array.isArray(input.hashtags)
      ? input.hashtags
          .filter((tag): tag is string => typeof tag === "string")
          .map((tag) => tag.replace(/^#/, "").trim())
          .filter(Boolean)
          .slice(0, 10)
      : [],
    source: source && source.name ? source : null,
  };
}

/**
 * 모델 응답 문자열에서 JSON 객체를 꺼낸다.
 *
 * 검색 도구를 켜면 응답 스키마를 강제할 수 없어서, 모델이 JSON 앞뒤에
 * 설명 문장이나 코드블록을 붙이는 경우가 많다. 그래서 파싱 전에
 * 바깥쪽 중괄호 구간만 잘라낸다.
 */
export function extractJson(text: string): unknown {
  const withoutFences = text.replace(/```(?:json)?/gi, "").trim();
  const start = withoutFences.indexOf("{");
  const end = withoutFences.lastIndexOf("}");
  if (start === -1 || end <= start) {
    throw new Error("응답에서 JSON을 찾지 못했습니다.");
  }
  return JSON.parse(withoutFences.slice(start, end + 1));
}
