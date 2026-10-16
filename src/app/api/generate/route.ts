import {
  extractJson,
  GENERATED_MAX_SLIDES,
  MIN_SLIDES,
  normalizeCardNews,
  normalizeSources,
  type CardNews,
  type CardNewsSource,
} from "@/lib/cardnews";
import { client, failure, startBudget, THINKING, withFallback } from "@/lib/gemini";
import { findSlidePhotos } from "@/lib/photo";
import { DEFAULT_TONE, isTone, type ToneId } from "@/lib/tone";

/** 카드 글 길이. 사진 · 자막 템플릿을 고르면 "caption"(자막처럼 짧게). */
type CopyMode = "full" | "caption";

/**
 * 모은 자료로 카드뉴스를 짓는다. 두 단계 중 두 번째.
 * 자료는 `/api/research` 가 돌려준 것을 화면이 그대로 넘긴다.
 */
export const maxDuration = 60;

/** 재시도를 시작하려면 최소 이만큼 남아 있어야 한다. */
const RETRY_NEEDS_MS = 22_000;

/** 받아 줄 자료의 최대 길이. 수집 단계가 자르는 선과 같다. */
const EVIDENCE_MAX_CHARS = 6_000;

const MATERIALS = ["기사 본문", "검색 자료"] as const;

/** 생성에 넘기는 근거가 무엇인지. 문구만 다르고 규칙은 같다. */
type Material = "기사 본문" | "검색 자료";

/**
 * 말투마다 바뀌는 문장 규칙과 마무리 장 규칙. **사실 규칙은 말투와 상관없이 같다.**
 * 처음엔 MICE 공공기관 뉴스 전용이라 뉴스형 하나였다(2026-10-16 셋으로).
 */
const TONE_RULES: Record<ToneId, { sentence: string; outro: string }> = {
  news: {
    sentence: `- **홍보 문구를 쓰지 마세요.** 권유("~해 보세요", "~만나요"), 감탄("무려",
  "드디어"), 치켜세우기("완승", "저력", "도약")는 금지입니다. 뉴스이지 광고가
  아닙니다. "~한다", "~했다" 같은 담담한 기사체로 끝내세요.`,
    outro: `body 마지막 줄에서만 저장이나 공유를 담담하게 권합니다.`,
  },
  info: {
    sentence: `- **친근한 설명체**로 쓰세요. "~해요", "~예요"처럼 독자에게 알려 주는 말투입니다.
- 독자가 바로 써먹을 수 있게 정리하는 글입니다. 감탄과 치켜세우기("무려",
  "역대급", "완승")는 쓰지 마세요. 권유는 마무리 장에서만 가볍게 합니다.`,
    outro: `body 마지막 줄에서 저장이나 공유를 가볍게 권해도 됩니다.`,
  },
  promo: {
    sentence: `- **독자에게 말을 거는 홍보 말투**로 쓰세요. "~해 보세요", "놓치지 마세요" 같은
  권유를 써도 됩니다. 참여 방법, 기간, 혜택처럼 독자가 움직이는 데 필요한 정보를 앞세우세요.
- 그래도 **사실보다 부풀리지 마세요.** 자료에 없는 "최초", "최대", "역대급"은 쓰지
  마세요. 감탄은 세트 전체에서 한두 번까지입니다.`,
    outro: `heading 이나 body 에서 참여·방문·신청을 권하며 끝내도 됩니다.`,
  },
  mood: {
    sentence: `- **반말 구어체의 SNS 감성 말투**로 쓰세요. 친구한테 말하듯 짧게 툭 던집니다.
  "~함", "~임", "~더라", "~해 봐", "~각" 같은 끝맺음과 "..." 말줄임을 써도 됩니다.
  예: "요즘 다 이렇게 입더라", "이건 진짜 저장각", "가을엔 무조건 이 조합임"
- 카드 글에는 이모지를 쓰지 마세요(캡션에는 한두 개까지 괜찮습니다). 비속어와
  남을 깎아내리는 말은 쓰지 마세요.
- 말투만 가벼울 뿐 **사실은 자료 그대로**입니다. 자료에 없는 "역대급", "최초",
  "품절 대란" 같은 말은 쓰지 마세요.
- 캡션도 같은 반말 말투로 씁니다. 출처는 "OO 보도에 따르면 ~래" 처럼 흐름 안에서 밝힙니다.`,
    outro: `heading 이나 body 에서 "저장해 둬", "같이 가 볼 사람" 처럼 가볍게 권해도 됩니다.`,
  },
};

/**
 * 사진 · 자막 템플릿을 골랐을 때 덧붙이는 규칙. 참고 자료 3번은 제목 두세 줄과
 * 짧은 한 줄이 전부다. 카드에 다 못 담는 사실은 캡션으로 보낸다.
 */
const CAPTION_COPY_RULES = `
[자막형 — 위 줄바꿈 규칙보다 이것이 우선합니다]
- 이 카드뉴스는 사진 위에 **자막처럼** 글씨만 얹습니다. 글이 아주 짧아야 합니다.
- 표지 heading 은 2~3줄, 한 줄 4~8자. sub 는 10자 이내 한 줄.
- 상세·마무리 heading 은 **1~2줄, 한 줄 5~10자**. 그 장에서 남길 한마디만.
- 상세·마무리 body 는 **딱 한 줄, 20자 이내**. 수치나 날짜 하나만 담습니다.
- 카드에 다 못 담은 구체적인 사실은 **캡션**에 적으세요.`;

function buildPrompt(
  keyword: string,
  article: string,
  material: Material = "기사 본문",
  sourceNames: string[] = [],
  tone: ToneId = DEFAULT_TONE,
  copy: CopyMode = "full"
): string {
  const toneRules = TONE_RULES[tone];
  return `당신은 인스타그램 카드뉴스를 만드는 한국어 에디터입니다.
아래 규칙을 지켜 카드뉴스 한 세트를 JSON으로 만들어 주세요.

[소재]
- 키워드: ${keyword}
- 아래 ${material}**만**을 근거로 삼으세요. 자료에 없는 사실, 수치, 순위는 절대 쓰지 마세요.

<${material}>
${article}
</${material}>

[사실 규칙]
- 확인되지 않은 내용을 지어내지 마세요. 위 자료에서 확인한 사실만 쓰세요.
- 수치가 확실하지 않으면 아예 쓰지 마세요. 대략적인 표현으로 얼버무리지 마세요.
- **기사에 없는 평가·감탄을 보태지 마세요.** 사실은 맞는데 말투만 과장되는 것도
  지어내는 것입니다. "무려", "완승", "압도적", "역대급" 같은 말을 쓰지 마세요.

[문장 규칙]
- 기사 문장을 그대로 옮기지 말고 반드시 새 문장으로 다시 쓰세요.
- 직접인용은 15단어 미만으로, 세트 전체에서 최대 한 번만 쓰세요.
- 관계자 발언은 따옴표로 인용하지 말고 "~라고 밝혔다" 같은 요약체로 처리하세요.
${toneRules.sentence}

[구성]
- 슬라이드는 **${MIN_SLIDES}~${GENERATED_MAX_SLIDES}장**. 첫 장은 표지, 마지막 장은 마무리, 나머지는 상세입니다.
  자료가 적으면 ${MIN_SLIDES}장, 많으면 ${GENERATED_MAX_SLIDES}장까지 씁니다. 같은 사실을 나눠 장을 늘리지 마세요.
- 표지(cover): sub에 짧은 소제목 한 줄(**12자 이내**), heading에 큰 헤드라인.
  body는 비우거나 한 줄만.
- 상세(detail): heading은 그 장의 핵심 한 문장, body에 구체적인 사실과 수치.
  - sub에 그 장이 무엇을 다루는지 **6자 이내**로 적으세요. 장마다 달라야 합니다.
    예: "예산", "유치 대상", "신청 방법"
- 마무리(outro): 내용을 한 줄로 정리합니다. ${toneRules.outro}
- 상세·마무리의 sub 는 상세 장에만 씁니다. 마무리에는 sub 를 비우세요.

[줄바꿈 규칙 — 매우 중요]
- heading과 body는 문자열이 아니라 "문자열 배열"입니다. 배열의 한 원소가 화면의 한 줄이 됩니다.
- 자동 줄바꿈에 맡기지 말고, 의미가 끊기지 않는 지점에서 직접 나누세요.
- "~습니다", "~했다", "~이다" 같은 서술어가 앞줄과 떨어져 혼자 남지 않게 하세요.
- **표지 heading 은 한 줄을 아주 짧게 끊으세요. 한 줄에 3~6자입니다.**
  대신 줄을 4~5줄로 많이 씁니다. 글자가 커져서 표지가 꽉 찹니다.
  좋은 예: ["국제회의에", "210억 원을", "쏟아붓는다"]
  나쁜 예: ["국제회의 유치에 210억 원을", "쏟아붓기로 했다"]
- 상세 heading 은 한 줄 7~11자, 2~3줄.
- body 는 한 줄 **12~16자**, 3~4줄(표지는 0~2줄). 길게 늘여 쓰지 말고
  짧게 끊으세요. 줄이 짧아야 글자가 커지고 화면이 찹니다.
- 별표와 등호는 글자 수에 세지 마세요.
${copy === "caption" ? CAPTION_COPY_RULES + "\n" : ""}
[강조 규칙]
강조 표시가 두 가지입니다. 세기가 다릅니다.

1. 별표 *이렇게* — 글자 색만 바뀝니다. 가벼운 강조.
2. 등호 둘 ==이렇게== — 형광펜처럼 뒤에 색이 깔립니다. 센 강조.

- 한 슬라이드에 별표는 **한 번에서 두 번까지만** 씁니다.
- **형광펜은 세트 전체에서 딱 두 번입니다. 세 번 이상 쓰면 안 됩니다.**
  - 한 번은 **표지**에.
  - 나머지 한 번은 상세·마무리 장을 통틀어 **가장 중요한 한 곳**에만.
  - **장마다 하나씩 쓰지 마세요.** 형광펜이 없는 장이 대부분이어야 정상입니다.
    흔해지면 형광펜이 아니라 배경이 됩니다.
- 형광펜은 세트 전체에서 딱 하나 남길 말, 가장 중요한 수치에 씁니다.
- 별표는 수치, 기관명, 판단을 가르는 낱말처럼 기억했으면 하는 것에 씁니다.
- 조사나 서술어까지 삼키지 말고 핵심 낱말만 감싸세요.
  좋은 예: "국제회의 *47건*을 새로 유치했다"
  나쁜 예: "국제회의 *47건을 새로* 유치했다"
- 둘을 겹쳐 쓰지 마세요. 별표와 등호를 함께 감싸면 안 됩니다.
- 강조할 것이 없으면 쓰지 않아도 됩니다.

[캡션]
- 캡션은 **어디서 나온 소식인지 밝히며** 시작하세요. 출처를 흐름 안에서
  자연스럽게 말합니다.
  좋은 예: "OO일보 보도에 따르면 OO시가 ~를 연다."
  좋은 예: "OO협회가 발표한 내용을 정리했습니다."
- 출처는 **한 곳만** 밝히세요. 여러 매체를 나열하지 마세요.${
    sourceNames.length
      ? ` 밝힐 출처는 ${sourceNames[0]} 입니다(사이트 주소이면 그 매체의 한글 이름으로).`
      : " 위 자료에 나온 매체·기관 이름 중 하나를 쓰세요."
  } 자료에 없는 매체를 지어내지 마세요.
- **주소(URL)는 쓰지 마세요.** 출처 주소는 캡션 끝에 따로 붙습니다.

[사진 검색어]
- **각 슬라이드마다** imageQuery 에 그 장의 배경 사진을 찾을 **영어** 검색어를
  2~4 단어로 적으세요. 세트 전체용 imageQuery 도 하나 적습니다(맨 바깥).
- **장마다 다른 장면**이어야 합니다. 같은 사진이 이어지면 넘길 이유가 없습니다.
  표지는 주제를 대표하는 전경, 상세 장은 그 장 내용에 맞는 장면(일정이면
  장소 입구, 참여 대상이면 사람들, 분야면 그 분야의 사물)으로 고릅니다.
- 스톡 사진 사이트에서 검색합니다. 기사 속 장소 그 자체가 아니어도 됩니다.
- 기사 분위기에 맞는 **일반적인 장면**이면 됩니다. 이런 것들입니다.
  - 장소·건물: "convention center", "city skyline", "cafe interior", "office"
  - 장면: "conference audience", "shopping street", "people working"
  - 소재: 기사가 다루는 것(예: 반도체면 "semiconductor wafer",
    반려동물이면 "dog", 화장품이면 "cosmetics", 음식이면 그 음식,
    패션이면 사람 대신 옷과 소품: "clothing rack", "sneakers", "handbag", "knit sweater flat lay")
- **실존 인물 이름, 회사·브랜드 이름, 로고는 쓰지 마세요.** 초상권·상표 문제가
  생깁니다.
- **한 사람이 중심인 장면은 피하세요**("woman holding cosmetics" 같은 것).
  사람이 나와야 하면 "conference audience", "exhibition visitors" 처럼 여럿이
  나오는 장면으로 씁니다. 그 밖에는 공간·사물 위주로 적습니다.

[디자인]
- accent는 주제 분위기에 맞는 어두운 계열 포인트 컬러 하나를 "#rrggbb" 형식으로 고르세요.
  이 색 하나로 세트 전체 배경 그라데이션을 만들기 때문에, 흰 글씨가 또렷하게 보일 만큼 충분히 어두워야 합니다.
- badge는 이 소식의 **분야**를 나타내는 8자 이내 분류 문구입니다. 모든 슬라이드에
  같은 값을 씁니다. 예: "MICE 뉴스", "IT 소식", "뷰티 트렌드", "여행 정보", "맛집 소식"

아래 구조의 순수 JSON만 출력하세요. 설명 문장이나 코드블록을 붙이지 마세요.

{
  "title": "카드뉴스 제목 (30자 이내, 내부 관리용)",
  "accent": "#1a3a5c",
  "slides": [
    {
      "kind": "cover",
      "badge": "분야 분류",
      "sub": "표지 위쪽 작은 소제목",
      "heading": ["표지 첫 줄", "==둘째 줄==", "셋째 줄", "넷째 줄"],
      "body": [],
      "imageQuery": "convention center exterior"
    },
    {
      "kind": "detail",
      "badge": "분야 분류",
      "sub": "예산",
      "heading": ["상세 헤드라인"],
      "body": ["본문 첫 줄에 *수치 42건*", "본문 둘째 줄"],
      "imageQuery": "conference audience"
    }
  ],
  "caption": "${copy === "caption" ? "인스타그램 캡션 4~7줄. 카드에 못 담은 사실을 여기에. 줄바꿈은 \\n 으로 표기 (350자 이내)" : "인스타그램 캡션 3~5줄. 줄바꿈은 \\n 으로 표기 (200자 이내)"}",
  "hashtags": ["해시태그1", "해시태그2", "해시태그3", "해시태그4", "해시태그5"],
  "imageQuery": "convention center",
  "source": { "name": "출처 매체명", "url": "" }
}

모든 텍스트는 한국어로 작성하세요.`;
}

/**
 * 한 번 생성한다. **검색 도구는 붙이지 않는다.**
 *
 * 예전에는 키워드만 들어오면 여기에 검색 도구를 붙여 "검색하면서 카드뉴스
 * JSON 까지" 한 번에 시켰다. 재 보니 그 한 번이 **30.2초**였다(3.8-flash,
 * 생각 토큰 2776). 시도 상한 32초에 1.8초 남았고, 배포 사이트에서 키워드
 * 경로만 매번 52초에 시간 초과였다.
 *
 * 상한을 늘리는 대신 일을 나눴다. 검색은 `/api/research` 가 따로 요청으로
 * 하고, 여기서는 손에 쥔 자료로 글만 짓는다.
 */
async function generateOnce(
  model: string,
  prompt: string,
  signal?: AbortSignal
): Promise<Generated> {
  const response = await client().models.generateContent({
    model,
    contents: prompt,
    config: {
      ...THINKING,
      // JSON 으로만 답하게 한다. 형식이 틀려(따옴표 빠진 키 등) 재시도하느라
      // 몇 초를 쓰는 일이 있었다. 검색 도구와는 같이 못 거는 설정이라 예전에는
      // 못 걸었다. 생성 단계에서 검색을 떼어 낸 뒤로 걸 수 있다.
      responseMimeType: "application/json",
      // 남은 시간이 다 되면 호출 자체를 끊는다. 안 끊으면 플랫폼이 함수를
      // 죽일 때까지 기다리게 되고, 그러면 우리가 오류를 만들 기회가 없다.
      ...(signal ? { abortSignal: signal } : {}),
    },
  });
  const raw = extractJson(response.text ?? "");
  const result = normalizeCardNews(raw);
  // 사진 검색어는 카드 데이터가 아니라서 정리 함수가 버린다. 따로 꺼낸다.
  const imageQuery =
    typeof raw === "object" && raw !== null && typeof (raw as { imageQuery?: unknown }).imageQuery === "string"
      ? ((raw as { imageQuery: string }).imageQuery).slice(0, 80)
      : "";
  // 장수가 범위를 벗어나면 형식 오류와 같이 다룬다. 바깥의 재시도가 더 엄한
  // 안내로 다시 부른다. 넘친 장을 잘라 내면 마무리 장이 사라진다.
  const count = result.slides.length;
  if (count < MIN_SLIDES || count > GENERATED_MAX_SLIDES) {
    throw new Error(`슬라이드가 ${count}장입니다. ${MIN_SLIDES}~${GENERATED_MAX_SLIDES}장이어야 합니다.`);
  }
  // 장마다의 사진 검색어도 정리 함수가 버리므로 따로 꺼낸다.
  const rawSlides =
    typeof raw === "object" && raw !== null && Array.isArray((raw as { slides?: unknown }).slides)
      ? ((raw as { slides: unknown[] }).slides)
      : [];
  const slideQueries = result.slides.map((_, i) => {
    const q = (rawSlides[i] as { imageQuery?: unknown } | undefined)?.imageQuery;
    return typeof q === "string" ? q.slice(0, 80) : "";
  });
  return { result, imageQuery, slideQueries };
}

interface Generated {
  result: CardNews;
  imageQuery: string;
  /** 장마다의 사진 검색어. 비어 있으면 세트 검색어를 쓴다. */
  slideQueries: string[];
}

/** 사진 검색에 줄 시간의 상한. 남은 시간이 이보다 적으면 그만큼만 쓴다. */
const PHOTO_MAX_MS = 6_000;

/**
 * 출처를 붙이고 배경 사진을 찾아 붙인다. 응답 직전에 한 번.
 *
 * 사진은 **어떤 템플릿을 고르든 찾아 둔다.** 생성할 때는 템플릿과 무관한 같은
 * 데이터를 만들고, 템플릿은 미리보기에서 바로 바꿀 수 있기 때문이다. 못
 * 찾아도 실패가 아니다. 사진 템플릿이 그라데이션으로 그린다.
 */
async function finish(
  { result, imageQuery, slideQueries }: Generated,
  links: CardNewsSource[],
  material: Material,
  left: () => number
): Promise<CardNews> {
  const withSrc = withSources(result, links, material);
  const withQuery = imageQuery ? { ...withSrc, photoQuery: imageQuery } : withSrc;
  const room = Math.min(PHOTO_MAX_MS, left() - 3_000);
  if (room < 1_500) return withQuery;

  // 장마다 다른 사진. 장 검색어가 비면 세트 검색어로 찾는다.
  const queries = slideQueries.map((q) => q || imageQuery);
  const photos = await findSlidePhotos(queries, imageQuery, room);
  console.info(
    `[generate] 사진 ${photos.filter(Boolean).length}/${photos.length}장: ` +
      queries.map((q, i) => `"${q}"→${photos[i] ? photos[i]!.source : "없음"}`).join(", ")
  );
  const slides = withQuery.slides.map((slide, i) => ({
    ...slide,
    ...(queries[i] ? { photoQuery: queries[i] } : {}),
    ...(photos[i] ? { photo: photos[i]! } : {}),
  }));
  // 세트 사진(예전 결과 호환, 홈 견본 등)은 표지 사진으로 둔다.
  const cover = photos.find(Boolean);
  return { ...withQuery, slides, ...(cover ? { photo: cover } : {}) };
}

/**
 * 출처 주소를 붙인다. 모델이 적은 주소는 쓰지 않는다.
 *
 * 프롬프트는 모델에게 `source.url` 을 적으라고 하지만 모델은 주소를 모른다
 * (기사 URL 을 넘기지도 않았다). 그래서 **키워드로 만든 결과도, 기사 URL 로
 * 만든 결과도 출처 주소가 늘 비어 있었다.** 사용자가 게시하려다 알아챘다.
 *
 * 기사 URL 로 만들면 출처 이름은 모델이 기사에서 읽은 매체명을 그대로 둔다
 * (그 주소가 바로 그 기사다). 키워드 검색이면 모델이 적은 매체명과 첫 주소의
 * 기사가 서로 다를 수 있어서, 이름도 주소 쪽(검색 근거의 사이트명)을 쓴다.
 */
function withSources(result: CardNews, links: CardNewsSource[], material: Material): CardNews {
  if (links.length === 0) return { ...result, source: result.source && { ...result.source, url: "" } };
  const [first] = links;
  const name = material === "기사 본문" && result.source?.name ? result.source.name : first.name;
  // 목록 첫 줄도 같은 이름으로 맞춘다. 안 그러면 기사 URL 로 만든 결과가
  // 출처 목록에 매체명 대신 사이트 주소(도메인)로 나온다.
  const sources = [{ name, url: first.url }, ...links.slice(1)];
  // 캡션 끝에 출처 주소를 붙인다. 캡션을 복사해 게시하면 출처까지 함께
  // 올라가게 하려는 것이다(사용자 요청). 매체명은 모델이 캡션 흐름 안에서
  // 말하고("부산일보 보도에 따르면"), 주소는 서버가 붙인다. 주소를 모델에게
  // 쓰게 하면 지어낸다.
  const caption = [result.caption.trim(), sources.map((s) => `출처: ${s.name} ${s.url}`).join("\n")]
    .filter(Boolean)
    .join("\n\n");
  return { ...result, caption, source: { name, url: first.url }, sources };
}

export async function POST(request: Request) {
  const left = startBudget();
  let subject: string;
  let evidence: string;
  let material: Material;
  let links: CardNewsSource[];
  let tone: ToneId;
  let copy: CopyMode;

  try {
    const body = await request.json();
    subject = typeof body.subject === "string" ? body.subject.trim() : "";
    evidence = typeof body.evidence === "string" ? body.evidence.trim() : "";
    material = MATERIALS.includes(body.material) ? body.material : "기사 본문";
    links = normalizeSources(body.links);
    tone = isTone(body.tone) ? body.tone : DEFAULT_TONE;
    copy = body.copy === "caption" ? "caption" : "full";
  } catch {
    return Response.json({ error: "요청 본문을 읽을 수 없습니다." }, { status: 400 });
  }

  // 근거 없이 지으면 모델이 없는 숫자를 지어낸다. 받지 않는다.
  if (!subject || !evidence) {
    return Response.json(
      { error: "근거 자료가 없습니다. 자료 수집부터 다시 해 주세요." },
      { status: 400 }
    );
  }

  const prompt = buildPrompt(
    subject,
    evidence.slice(0, EVIDENCE_MAX_CHARS),
    material,
    links.map((l) => l.name),
    tone,
    copy
  );
  const generate = (p: string) => (model: string, signal: AbortSignal) =>
    generateOnce(model, p, signal);

  // 응답 스키마를 강제하지 않으므로 형식이 틀어질 때가 있다.
  // 형식 문제로만 한 번 더 시도하고, 그래도 실패하면 오류로 돌려준다.
  try {
    const generated = await withFallback(generate(prompt), left, "생성", "flash");
    return Response.json(await finish(generated, links, material, left));
  } catch (firstError) {
    console.warn("[generate] 1차 실패:", firstError);

    // 남은 시간이 모자라면 재시도하지 않는다. 시작해 봐야 중간에 잘리고,
    // 그러면 플랫폼이 함수를 죽여 오류조차 제대로 못 돌려준다.
    if (left() < RETRY_NEEDS_MS) return failure(firstError, "카드뉴스 생성");

    try {
      const stricter = `${prompt}\n\n[재시도 안내]\n직전 응답이 형식에 맞지 않았습니다. 여는 중괄호로 시작해 닫는 중괄호로 끝나는 JSON 하나만, 다른 글자 없이 출력하세요. 슬라이드는 반드시 ${MIN_SLIDES}~${GENERATED_MAX_SLIDES}장입니다.`;
      const generated = await withFallback(generate(stricter), left, "재시도", "flash");
      return Response.json(await finish(generated, links, material, left));
    } catch (error) {
      console.error("[generate] 최종 실패:", error);
      return failure(error, "카드뉴스 생성");
    }
  }
}
