import * as cheerio from "cheerio";
import {
  client,
  failure,
  startBudget,
  THINKING,
  TryNextModel,
  withFallback,
} from "@/lib/gemini";

/**
 * 카드뉴스의 근거를 모은다. 두 단계 중 첫 번째.
 *
 * 기사 URL 을 줬고 본문을 읽어 오면 그 본문이 곧 근거다. 모델을 부르지
 * 않는다. 못 읽었거나 키워드만 줬으면 검색 도구로 사실을 모은다.
 * 결과는 화면이 받아 두었다가 `/api/generate` 에 그대로 넘긴다.
 */
export const maxDuration = 60;

/** 기사 본문을 읽어올 때 기다릴 시간. 이보다 오래 걸리면 검색으로 모은다. */
const ARTICLE_FETCH_TIMEOUT_MS = 6_000;
const ARTICLE_MAX_CHARS = 6_000;

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

/** 검색으로 모은 자료의 최대 길이. 기사 본문과 같은 선으로 자른다. */
const RESEARCH_MAX_CHARS = ARTICLE_MAX_CHARS;

/**
 * 검색 도구로 자료만 모은다. 카드뉴스는 만들지 않는다.
 *
 * 결과는 평문 사실 목록이다. JSON 도, 줄 배열도, 강조 표시도 시키지 않는다.
 * 그런 규칙을 지키느라 생각하는 시간이 한 번에 몰렸던 것이 문제였으므로,
 * 이 단계는 찾고 옮겨 적는 일만 한다.
 *
 * 검색 도구는 일반 생성과 **할당량이 따로**다. 이 단계만 그 할당량을 쓴다.
 */
async function research(
  model: string,
  subject: string,
  signal?: AbortSignal
): Promise<string> {
  const response = await client().models.generateContent({
    model,
    contents: `Google 검색으로 다음 주제의 최신 한국 기사를 찾아, 카드뉴스의 근거로 쓸 사실을 정리하세요.

주제: ${subject}

- **답하기 전에 반드시 Google 검색 도구를 실행하세요.** 기억에 의존해 답하지 마세요.
- 가장 최근의 기사 한두 건을 중심으로 정리하세요. 여러 사건을 섞지 마세요.
- 기관명, 날짜, 금액·건수 같은 수치, 사업 이름, 일정처럼 확인된 사실만 적으세요.
- 검색에서 확인하지 못한 것은 적지 마세요. 추측이나 평가는 넣지 마세요.
- 기사 문장을 그대로 옮기지 말고 짧은 사실 단위로 적으세요.
- 맨 끝에 "출처:" 줄을 두고 근거로 삼은 매체명과 기사 제목을 적으세요.
- 평문 목록으로 ${RESEARCH_MAX_CHARS / 2}자 이내. 머리말이나 맺음말은 쓰지 마세요.`,
    config: {
      ...THINKING,
      tools: [{ googleSearch: {} }],
      ...(signal ? { abortSignal: signal } : {}),
    },
  });

  const text = (response.text ?? "").trim();
  if (!text) {
    throw new TryNextModel(
      "검색으로 자료를 찾지 못했습니다. 키워드를 바꾸거나 기사 URL을 넣어 주세요."
    );
  }

  // 검색 근거 표시(groundingMetadata)가 없어도 **거르지 않는다.**
  // 처음에는 표시가 없으면 "검색 안 하고 기억으로 썼다"고 보고 버렸다. 그런데
  // lite 모델은 오늘 날짜의 사실을 담아 답하면서도(= 검색을 했다) 표시를 비워
  // 보낼 때가 많았다. 같은 프롬프트로 세 번 연속 그랬다. 표시로는 검색 여부를
  // 가릴 수 없으니 멀쩡한 답을 버리지 않고, 로그로만 남겨 지켜본다.
  const grounding = response.candidates?.[0]?.groundingMetadata;
  if (!grounding?.groundingChunks?.length && !grounding?.webSearchQueries?.length) {
    console.warn(`[research] ${model}: 검색 근거 표시 없음 (답은 받음)`);
  }
  return text.slice(0, RESEARCH_MAX_CHARS);
}

export async function POST(request: Request) {
  const left = startBudget();
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
  // 본문을 못 읽었는데 키워드도 없으면 검색할 거리가 없다. 그럴 때는 주소
  // 자체를 준다. "입력된 기사 내용 요약" 같은 문구로는 아무것도 못 찾는다.
  const subject = keyword || (article ? "아래 기사 본문의 내용" : url);

  if (article) {
    console.info(`[research] 기사 본문 ${article.length}자를 읽었습니다. 검색하지 않습니다.`);
    return Response.json({ subject, material: "기사 본문", evidence: article });
  }
  if (url) console.warn("[research] 기사 본문을 읽지 못해 검색으로 자료를 모읍니다:", url);

  try {
    const evidence = await withFallback(
      (model, signal) => research(model, subject, signal),
      left,
      "검색"
    );
    console.info(`[research] 검색 자료 ${evidence.length}자`);
    return Response.json({ subject, material: "검색 자료", evidence });
  } catch (error) {
    console.error("[research] 실패:", error);
    return failure(error, "자료 검색");
  }
}
