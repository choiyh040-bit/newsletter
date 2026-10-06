/**
 * 카드뉴스 규격과 데이터 형태.
 *
 * 인스타그램 세로 카드(4:5) 기준으로 고정한다. 렌더링 크기를 한 곳에서만
 * 정의해서 미리보기와 PNG 내보내기가 같은 값을 쓰도록 한다.
 */

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1350;

/**
 * 슬라이드 장수 범위.
 *
 * 모델에게는 4~5장을 만들라고 한다(프롬프트 [구성]). 상한을 8로 둔 것은
 * **사람이 편집기에서 장을 더 붙일 수 있게** 하기 위해서다. 생성 분량과
 * 사람이 손볼 수 있는 분량은 다른 값이다.
 */
export const MIN_SLIDES = 4;
export const MAX_SLIDES = 8;

/** 포인트 컬러를 못 고르거나 형식이 틀렸을 때 쓰는 기본값. */
export const DEFAULT_ACCENT = "#0f5b8c";

export type SlideKind = "cover" | "detail" | "outro";

/**
 * 한 줄을 이루는 조각.
 *
 * 한 줄 안에서 일부 단어만 색을 달리하려면 줄을 통째로 다룰 수 없다.
 * 그래서 줄을 조각으로 쪼개 두고, 강조할 조각에만 표시를 남긴다.
 */
/**
 * 조각을 어떻게 꾸밀지.
 *
 * 색 바꾸기 하나로는 폭이 안 나온다. 같은 기법을 반복하면 결국 다 비슷해
 * 보여서 강조가 묻힌다. 참고 자료 E·F·G 가 공통으로 쓰던 **형광펜**을
 * 한 단계 더 센 기법으로 둔다.
 */
export type SpanStyle = "plain" | "accent" | "mark";

export interface TextSpan {
  text: string;
  style: SpanStyle;
}

/** 화면의 한 줄. 조각들이 옆으로 이어 붙는다. */
export type TextLine = TextSpan[];

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
  heading: TextLine[];
  /** 본문. heading과 같은 규칙으로 한 원소가 한 줄이다. */
  body: TextLine[];
  /**
   * 그 장에서 남길 한 마디. 상세 장 맨 아래 상자에 들어간다.
   *
   * 참고 자료 E 를 재 보니, 정보가 담긴 장은 거의 다 **데이터를 늘어놓고
   * 끝내지 않고** 테두리 있는 상자에 결론 한두 줄을 넣어 마무리했다.
   * 그래야 "그래서 뭐?"가 눈으로 분리된다. body 안에 섞어 두면 같은 무게로
   * 깔려서 결론이 아니라 넷째 줄이 된다.
   *
   * 없으면 상자를 그리지 않는다.
   */
  note: TextLine[];
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

/**
 * 강조 표시 두 가지.
 *
 * - `*이렇게*` — 글자 색만 포인트 컬러로 바꾼다. 가벼운 쪽.
 * - `==이렇게==` — 형광펜처럼 뒤에 색을 깐다. 센 쪽. 한 세트에 몇 번 안 쓴다.
 *
 * 모델에게 중첩 객체 배열을 받는 대신 문자열 안에 표시를 넣게 했다. 응답
 * 형식이 지금까지와 같은 문자열 배열로 유지되어, 이미 저장해 둔 결과도
 * 그대로 읽힌다. 모델 입장에서도 배열을 겹쳐 만드는 것보다 훨씬 쉽다.
 *
 * `==` 를 고른 이유는 한국어 기사 본문에 거의 나오지 않기 때문이다. 별표는
 * 이미 쓰고 있고, 밑줄(`_`)이나 별표 둘(`**`)은 짝이 어긋날 여지가 많다.
 */
const MARKS = /==([^=]+)==|\*([^*]+)\*/g;

/** 한 줄 문자열을 조각으로 쪼갠다. 짝이 맞지 않는 표시는 그냥 글자로 둔다. */
function parseSpans(line: string): TextLine {
  const spans: TextLine = [];
  let cursor = 0;

  for (const match of line.matchAll(MARKS)) {
    const start = match.index;
    if (start > cursor) {
      spans.push({ text: line.slice(cursor, start), style: "plain" });
    }
    // 겹쳐 쓰는 것은 지원하지 않는다. 먼저 걸린 쪽을 쓴다.
    spans.push(
      match[1] !== undefined
        ? { text: match[1], style: "mark" }
        : { text: match[2], style: "accent" }
    );
    cursor = start + match[0].length;
  }

  if (cursor < line.length) {
    spans.push({ text: line.slice(cursor), style: "plain" });
  }
  return spans.length > 0 ? spans : [{ text: line, style: "plain" }];
}

/**
 * 보관해 둔 조각의 꾸밈을 읽는다.
 *
 * 형광펜이 생기기 전에는 조각이 `accent: boolean` 이었다. 꺼낼 때 지금
 * 형식으로 옮긴다.
 */
function toSpanStyle(raw: Record<string, unknown>): SpanStyle {
  if (raw.style === "mark" || raw.style === "accent" || raw.style === "plain") {
    return raw.style;
  }
  return raw.accent === true ? "accent" : "plain";
}

/** 한 줄의 글자만 이어 붙인다. 제목처럼 꾸밈이 필요 없는 곳에서 쓴다. */
export function lineText(line: TextLine): string {
  return line.map((span) => span.text).join("");
}

/**
 * 조각 배열을 다시 표시가 붙은 글자로 되돌린다. `parseSpans` 의 반대다.
 *
 * 편집기가 필요로 한다. 사람이 고칠 때는 조각 배열이 아니라 글자를 보고
 * 고치기 때문이다. 쓰기(사람 → 조각)는 이미 `toLines` 가 하고 있었고,
 * 읽기(조각 → 사람) 쪽이 없었다.
 *
 * 글 안에 별표나 등호가 원래 들어 있으면 되돌릴 때 표시로 오해될 수 있다.
 * 한국어 기사 본문에 그런 글자가 거의 없어 지금은 그대로 두지만, 문제가
 * 생기면 여기서 escape 를 넣어야 한다.
 */
export function linesToMarkup(lines: TextLine[]): string {
  return lines
    .map((line) =>
      line
        .map((span) =>
          span.style === "mark"
            ? `==${span.text}==`
            : span.style === "accent"
              ? `*${span.text}*`
              : span.text
        )
        .join("")
    )
    .join("\n");
}

/** 편집기가 쓴 글자를 줄 배열로 되돌린다. 줄바꿈 하나가 카드의 한 줄이다. */
export function parseLines(text: string, maxLines: number): TextLine[] {
  return toLines(text, maxLines);
}

/**
 * 문자열이든 배열이든 받아서 "한 원소 = 한 줄" 배열로 만든다.
 *
 * 이미 조각으로 쪼개진 값(보관해 둔 결과를 다시 읽는 경우)도 그대로 통과시켜,
 * 저장소에서 꺼낸 것과 모델이 갓 만든 것을 같은 함수로 다룰 수 있게 한다.
 */
function toLines(value: unknown, maxLines: number): TextLine[] {
  const raw = Array.isArray(value) ? value : [value];

  return raw
    .flatMap((line): TextLine[] => {
      if (typeof line === "string") {
        return line
          .split(/<br\s*\/?>|\n/)
          .map((part) => part.trim())
          .filter(Boolean)
          .map(parseSpans);
      }
      // 이미 조각 배열인 경우
      if (Array.isArray(line)) {
        const spans = line
          .filter(
            (span): span is TextSpan =>
              typeof span === "object" && span !== null && typeof span.text === "string"
          )
          .map((span) => ({
            text: span.text,
            style: toSpanStyle(span as unknown as Record<string, unknown>),
          }));
        return lineText(spans).trim() ? [spans] : [];
      }
      return [];
    })
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
      heading: toLines(slide.heading, kind === "cover" ? 5 : 3),
      body: toLines(slide.body, kind === "cover" ? 2 : 4),
      note: kind === "detail" ? toLines(slide.note, 2) : [],
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
    title: toText(input.title, slides[0].heading.map(lineText).join(" ")),
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
