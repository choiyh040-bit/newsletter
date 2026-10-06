import { GoogleGenAI } from "@google/genai";
import * as cheerio from "cheerio";
import {
  extractJson,
  normalizeCardNews,
  type CardNews,
} from "@/lib/cardnews";

/**
 * 검색과 생성을 한 번에 하므로 기본 제한(보통 10초)으로는 자주 잘린다.
 * Vercel 서버리스 함수 상한에 맞춰 60초로 올린다.
 */
export const maxDuration = 60;

const MODEL = "gemini-3-flash-preview";

/** 기사 본문을 읽어올 때 기다릴 시간. 이보다 오래 걸리면 검색으로만 만든다. */
const ARTICLE_FETCH_TIMEOUT_MS = 10_000;
const ARTICLE_MAX_CHARS = 6_000;

function client() {
  // 붙여넣다 딸려 온 공백이나 줄바꿈을 털어낸다. 키가 공백뿐이면 값이
  // 있는 것으로 쳐서 그대로 호출하게 되고, 구글에서 알아보기 어려운
  // 인증 오류로 돌아온다.
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error("GEMINI_API_KEY가 설정되지 않았습니다.");

  // vertexai 를 명시하지 않으면 SDK 가 환경 변수
  // (GOOGLE_GENAI_USE_VERTEXAI / GOOGLE_GENAI_USE_ENTERPRISE)를 보고
  // 스스로 Vertex AI 모드로 넘어간다. 그 모드는 API 키가 아니라 OAuth
  // 토큰으로 인증하므로, 키가 멀쩡해도 401(UNAUTHENTICATED)이 난다.
  // 우리는 AI Studio 키만 쓰므로 모드를 코드에서 못박는다.
  return new GoogleGenAI({ apiKey, vertexai: false });
}

/** 기사 URL에서 사람이 읽는 본문만 뽑아낸다. 실패하면 빈 문자열. */
async function readArticle(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(ARTICLE_FETCH_TIMEOUT_MS),
      // 언론사 다수가 봇처럼 보이는 UA 를 막는다. 평범한 브라우저로 요청해야
      // 본문을 받아올 확률이 높고, 본문을 받아와야 검색 할당량을 안 쓴다.
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept-Language": "ko-KR,ko;q=0.9",
      },
    });
    if (!res.ok) return "";

    const $ = cheerio.load(await res.text());
    $("script, style, noscript, iframe, nav, header, footer, aside").remove();

    // 기사 본문이 들어가는 흔한 컨테이너를 먼저 찾고, 없으면 body 전체를 쓴다.
    const article = $("article").text() || $("#articleBody").text() || $("body").text();
    return article.replace(/\s+/g, " ").trim().slice(0, ARTICLE_MAX_CHARS);
  } catch {
    return "";
  }
}

function buildPrompt(keyword: string, article: string): string {
  return `당신은 인스타그램 카드뉴스를 만드는 한국어 에디터입니다.
아래 규칙을 지켜 카드뉴스 한 세트를 JSON으로 만들어 주세요.

[소재]
- 키워드: ${keyword}
${
  article
    ? `- 아래 기사 본문**만**을 근거로 삼으세요. 본문에 없는 사실, 수치, 순위는 절대 쓰지 마세요.\n\n<기사 본문>\n${article}\n</기사 본문>`
    : `- 제공된 기사 본문이 없습니다. 반드시 Google 검색 도구를 실행해 최신 기사와 수치를 확인한 뒤 작성하세요.`
}

[사실 규칙]
- 확인되지 않은 내용을 지어내지 마세요. 검색이나 기사에서 확인한 사실만 쓰세요.
- 수치가 확실하지 않으면 아예 쓰지 마세요. 대략적인 표현으로 얼버무리지 마세요.
- **기사에 없는 평가·감탄을 보태지 마세요.** 사실은 맞는데 말투만 과장되는 것도
  지어내는 것입니다. "무려", "완승", "압도적", "역대급" 같은 말을 쓰지 마세요.

[문장 규칙]
- 기사 문장을 그대로 옮기지 말고 반드시 새 문장으로 다시 쓰세요.
- 직접인용은 15단어 미만으로, 세트 전체에서 최대 한 번만 쓰세요.
- 관계자 발언은 따옴표로 인용하지 말고 "~라고 밝혔다" 같은 요약체로 처리하세요.

[구성]
- 슬라이드는 4장 또는 5장. 첫 장은 표지, 마지막 장은 마무리, 나머지는 상세입니다.
- 표지(cover): sub에 짧은 소제목 한 줄(**12자 이내**), heading에 큰 헤드라인.
  body는 비우거나 한 줄만.
- 상세(detail): heading은 그 장의 핵심 한 문장, body에 구체적인 사실과 수치.
  - sub에 그 장이 무엇을 다루는지 **6자 이내**로 적으세요. 장마다 달라야 합니다.
    예: "예산", "유치 대상", "신청 방법"
  - note에 **그 장의 사실에서 끌어낸 판단**을 1~2줄 적으세요. 한 줄 14자 이내.
    body 문장을 그대로 옮기지 말고, "이 숫자가 뜻하는 것"을 적습니다.
    - **body 에 이미 쓴 말을 되풀이하지 마세요.** 같은 말을 줄여 쓴 것은
      결론이 아니라 요약입니다. body 를 읽고 나서 비로소 알 수 있는 것을
      적어야 합니다.
    - **홍보 문구를 쓰지 마세요.** 권유("~해 보세요", "~만나요"), 감탄("무려",
      "드디어"), 치켜세우기("완승", "저력", "도약")는 전부 금지입니다.
      공공기관 뉴스이지 광고가 아닙니다.
    - **기사에 없는 평가어를 쓰지 마세요.** 기사가 "유치했다"라고만 했으면
      "완승", "압도" 같은 말을 붙일 수 없습니다.
    - 담담한 서술로 끝내세요.
      좋은 예: ["건수보다 체류 기간이", "기준이 됐다"]
      나쁜 예: ["도시의 경제 활력을", "수소가 끌어올립니다"]
- 마무리(outro): 내용을 한 줄로 정리합니다. body 마지막 줄에서만 저장이나
  공유를 담담하게 권합니다. heading 은 권유가 아니라 **정리**여야 합니다.
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

[디자인]
- accent는 주제 분위기에 맞는 어두운 계열 포인트 컬러 하나를 "#rrggbb" 형식으로 고르세요.
  이 색 하나로 세트 전체 배경 그라데이션을 만들기 때문에, 흰 글씨가 또렷하게 보일 만큼 충분히 어두워야 합니다.
- badge는 모든 슬라이드에 같은 값을 쓰고, 8자 이내의 분류 문구로 하세요.

아래 구조의 순수 JSON만 출력하세요. 설명 문장이나 코드블록을 붙이지 마세요.

{
  "title": "카드뉴스 제목 (30자 이내, 내부 관리용)",
  "accent": "#1a3a5c",
  "slides": [
    {
      "kind": "cover",
      "badge": "MICE 뉴스",
      "sub": "표지 위쪽 작은 소제목",
      "heading": ["표지 첫 줄", "==둘째 줄==", "셋째 줄", "넷째 줄"],
      "body": []
    },
    {
      "kind": "detail",
      "badge": "MICE 뉴스",
      "sub": "예산",
      "heading": ["상세 헤드라인"],
      "body": ["본문 첫 줄에 *수치 42건*", "본문 둘째 줄"],
      "note": ["이 장에서 남길", "한 마디"]
    }
  ],
  "caption": "인스타그램 캡션 3~5줄. 줄바꿈은 \\n 으로 표기 (200자 이내)",
  "hashtags": ["해시태그1", "해시태그2", "해시태그3", "해시태그4", "해시태그5"],
  "source": { "name": "출처 매체명", "url": "기사 URL 또는 빈 문자열" }
}

모든 텍스트는 한국어로 작성하세요.`;
}

/**
 * 한 번 생성한다.
 *
 * `useSearch` 가 거짓이면 검색 도구를 아예 붙이지 않는다. 검색 도구는
 * 일반 생성과 **할당량이 따로**라, 붙이는 것만으로 429 가 날 수 있다.
 * 기사 본문을 이미 읽어 온 경우에는 근거가 손에 있으므로 붙이지 않는다.
 */
async function generateOnce(prompt: string, useSearch: boolean): Promise<CardNews> {
  const response = await client().models.generateContent({
    model: MODEL,
    contents: prompt,
    config: useSearch ? { tools: [{ googleSearch: {} }] } : {},
  });
  return normalizeCardNews(extractJson(response.text ?? ""));
}

export async function POST(request: Request) {
  let keyword: string;
  let url: string;

  try {
    const body = await request.json();
    keyword = typeof body.keyword === "string" ? body.keyword.trim() : "";
    url = typeof body.url === "string" ? body.url.trim() : "";
  } catch {
    return Response.json({ error: "요청 본문을 읽을 수 없습니다." }, { status: 400 });
  }

  if (!keyword && !url) {
    return Response.json(
      { error: "키워드나 기사 URL 중 하나는 입력해야 합니다." },
      { status: 400 }
    );
  }

  const article = url ? await readArticle(url) : "";
  if (url && !article) {
    console.warn("기사 본문을 읽지 못해 검색만으로 생성합니다:", url);
  }

  // 근거가 손에 없을 때만 검색에 기댄다. 본문을 읽어 왔으면 검색 도구를
  // 붙이지 않아, 따로 걸려 있는 검색 할당량을 쓰지 않는다.
  const useSearch = !article;

  // 본문을 못 읽었는데 키워드도 없으면 검색할 거리가 없다. 그럴 때는 주소
  // 자체를 준다. "입력된 기사 내용 요약" 같은 문구로는 아무것도 못 찾는다.
  const subject = keyword || (article ? "아래 기사 본문의 내용" : url);
  const prompt = buildPrompt(subject, article);

  // 검색 도구를 켜면 응답 스키마를 강제할 수 없어 형식이 틀어질 때가 있다.
  // 형식 문제로만 한 번 더 시도하고, 그래도 실패하면 오류로 돌려준다.
  try {
    return Response.json(await generateOnce(prompt, useSearch));
  } catch (firstError) {
    console.warn("첫 생성 실패, 재시도합니다:", firstError);
    try {
      const stricter = `${prompt}\n\n[재시도 안내]\n직전 응답이 형식에 맞지 않았습니다. 여는 중괄호로 시작해 닫는 중괄호로 끝나는 JSON 하나만, 다른 글자 없이 출력하세요.`;
      return Response.json(await generateOnce(stricter, useSearch));
    } catch (error) {
      console.error("카드뉴스 생성 실패:", error);
      const message = error instanceof Error ? error.message : "알 수 없는 오류";
      return Response.json(
        { error: "카드뉴스 생성에 실패했습니다.", detail: message },
        { status: 500 }
      );
    }
  }
}
