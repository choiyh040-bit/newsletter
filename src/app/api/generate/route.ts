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

/**
 * 모델 목록을 **실행할 때 받아 온다.**
 *
 * 처음에는 쓸 모델 이름을 코드에 박아 뒀다. 그런데 그 목록이 두 번 낡았다.
 * 한 번은 단종(`gemini-2.5-flash` 가 404)으로, 한 번은 용량(적어 둔 것이
 * 전부 503)으로. **구글 쪽 사정은 우리가 배포할 때마다 바뀌지 않는다.**
 * 그래서 이름을 고정하지 않고, 지금 계정이 쓸 수 있는 것을 받아서 고른다.
 *
 * 다만 **아무거나 쓰면 안 된다.** 목록에는 글을 짓는 모델만 있는 것이 아니라
 * 음악(lyria), 이미지(nano-banana), 음성(tts·transcribe), 로봇, 임베딩이
 * 섞여 있다. 그런 것에 카드뉴스를 시키면 30초를 버리고 쓰레기를 받는다.
 * 이름으로 걸러 내고 순서를 매긴다.
 */

/** 글을 짓는 데 못 쓰는 것들. 이름에 이게 들어가면 뺀다. */
const NOT_FOR_TEXT =
  /(image|tts|transcribe|audio|live|computer-use|robotics|omni|embedding|customtools|nano-banana|lyria|antigravity|deep-research)/;

/** 목록을 못 받아 왔을 때 쓸 최소한의 이름. */
const FALLBACK_MODELS = ["gemini-flash-latest", "gemini-flash-lite-latest"];

/**
 * 등급마다 몇 개씩 담을지.
 *
 * 그냥 상위 N 개를 자르면 안 된다. 실제로 한 번 그렇게 했다가, 상위 여섯
 * 개가 전부 같은 등급(flash)이라 **그때 유일하게 살아 있던 lite 가 잘려
 * 나갔다.** 등급이 통째로 막히는 일이 실제로 일어나므로, 각 등급에서 몇
 * 개씩 가져와 **반드시 아래 등급까지 닿게** 한다.
 */
const PICK_PER_TIER = { flash: 4, lite: 3, pro: 1 } as const;

/**
 * 순위를 매긴다. 작을수록 먼저 쓴다. null 이면 안 쓴다.
 *
 * 등급(flash → flash-lite → pro)을 먼저 보고, 같은 등급에서는 버전이 높은
 * 것을 먼저 쓴다. pro 를 뒤로 보낸 것은 품질이 아니라 **시간** 때문이다.
 * 느려서 제한 시간을 넘길 위험이 크다. 앞이 다 막혔을 때만 간다.
 */
function rankModel(name: string): number | null {
  if (!name.startsWith("gemini-")) return null;
  if (NOT_FOR_TEXT.test(name)) return null;

  const isFlash = name.includes("flash");
  const isPro = name.includes("pro");
  if (!isFlash && !isPro) return null;

  const tier = isPro ? 200 : name.includes("lite") ? 100 : 0;
  // 버전 없는 별칭(gemini-flash-latest)은 0 이 되어 같은 등급의 맨 뒤로 간다.
  const version = Number(/gemini-(\d+(?:\.\d+)?)/.exec(name)?.[1] ?? 0);
  return tier - version;
}

/**
 * 목록은 자주 바뀌지 않으므로 잠깐 재사용한다. 서버리스 인스턴스가 살아
 * 있는 동안만 유효하고, 사라지면 그냥 다시 받는다.
 */
let modelCache: { at: number; models: string[] } | null = null;
const MODEL_CACHE_MS = 10 * 60_000;

async function usableModels(): Promise<string[]> {
  if (modelCache && Date.now() - modelCache.at < MODEL_CACHE_MS) {
    return modelCache.models;
  }
  try {
    const names: string[] = [];
    for await (const model of await client().models.list()) {
      const name = (model.name ?? "").replace(/^models\//, "");
      // 글을 짓는 데 쓸 수 있다고 스스로 밝힌 것만 본다.
      if (!model.supportedActions?.includes("generateContent")) continue;
      if (rankModel(name) !== null) names.push(name);
    }
    const tierOf = (n: string) =>
      n.includes("pro") ? "pro" : n.includes("lite") ? "lite" : "flash";

    const sorted = names.sort((a, b) => rankModel(a)! - rankModel(b)!);
    const ranked = (["flash", "lite", "pro"] as const).flatMap((tier) =>
      sorted.filter((n) => tierOf(n) === tier).slice(0, PICK_PER_TIER[tier])
    );

    if (ranked.length === 0) return FALLBACK_MODELS;
    modelCache = { at: Date.now(), models: ranked };
    console.info(`[generate] 쓸 수 있는 모델 ${ranked.length}개: ${ranked.join(", ")}`);
    return ranked;
  } catch (error) {
    console.warn("[generate] 모델 목록을 못 받아 왔습니다. 기본값을 씁니다:", error);
    return FALLBACK_MODELS;
  }
}

/** 한 모델을 시도하려면 최소 이만큼 남아 있어야 한다. */
const ATTEMPT_NEEDS_MS = 12_000;

/**
 * 응답을 만들어 돌려주려고 남겨 두는 시간.
 *
 * 한때 "한 번에 42초"라는 상한을 뒀다. 느린 모델 하나가 예산을 다 먹는
 * 것을 막으려는 것이었는데, **재 보니 그 상한이 멀쩡한 생성을 죽이고
 * 있었다** — 세 번 중 두 번이 정확히 42초에 잘렸다.
 *
 * 예산이 55초인데 생성 한 번이 19~45초다. **"한 번을 짧게 끊는 것"과
 * "느린 성공을 기다려 주는 것"을 둘 다 할 수 있는 시간이 애초에 없다.**
 * 둘 중에는 기다려 주는 쪽이 낫다. 늘어지는 모델은 가끔이지만, 상한은
 * 매번 걸린다.
 *
 * 그래서 한 번에 **남은 시간을 거의 다** 준다. 전체 예산이 플랫폼에
 * 죽임당하는 것은 이미 막고 있다.
 */
const RESPONSE_RESERVE_MS = 3_000;

/**
 * 다음 모델로 넘어갈 만한 실패인지.
 *
 * 넘어갈 것: 용량 부족(503), 쿼터(429 — 모델마다 따로 걸린다), 단종(404).
 * 넘어가지 않을 것: 인증(401·403)과 잘못된 요청(400). 모델을 바꿔도 같다.
 * 우리가 던지는 형식 오류도 여기 해당하지 않는다. 그건 바깥의 재시도가
 * 더 엄한 프롬프트로 다시 부른다.
 */
function isModelUnavailable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("UNAVAILABLE") ||
    message.includes("RESOURCE_EXHAUSTED") ||
    message.includes("NOT_FOUND") ||
    message.includes("overloaded") ||
    message.includes("high demand")
  );
}

/** 기사 본문을 읽어올 때 기다릴 시간. 이보다 오래 걸리면 검색으로만 만든다. */
const ARTICLE_FETCH_TIMEOUT_MS = 6_000;

/**
 * 이 요청에 쓸 수 있는 시간.
 *
 * `maxDuration` 보다 짧게 잡는다. 상한을 넘기면 Vercel 이 함수를 죽이는데,
 * 그때 돌아오는 것은 **우리 JSON 이 아니라 플랫폼의 오류 페이지**다. 화면은
 * 그걸 JSON 으로 읽으려다 엉뚱한 구문 오류를 띄우고, 진짜 원인(시간 초과)은
 * 어디에도 안 남는다. 죽기 전에 우리가 먼저 끝내고 제대로 된 오류를 돌려준다.
 */
const BUDGET_MS = 55_000;

/** 재시도를 시작하려면 최소 이만큼 남아 있어야 한다. */
const RETRY_NEEDS_MS = 22_000;
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
async function generateOnce(
  model: string,
  prompt: string,
  useSearch: boolean,
  signal?: AbortSignal
): Promise<CardNews> {
  const response = await client().models.generateContent({
    model,
    contents: prompt,
    config: {
      ...(useSearch ? { tools: [{ googleSearch: {} }] } : {}),
      // 남은 시간이 다 되면 호출 자체를 끊는다. 안 끊으면 플랫폼이 함수를
      // 죽일 때까지 기다리게 되고, 그러면 우리가 오류를 만들 기회가 없다.
      ...(signal ? { abortSignal: signal } : {}),
    },
  });
  return normalizeCardNews(extractJson(response.text ?? ""));
}

/**
 * 모델을 차례로 시도한다. 붐비는 모델을 만나면 다음으로 넘어간다.
 *
 * 붐비는 응답은 1초 안쪽에 돌아오므로 여러 개를 거쳐도 시간을 거의 안 쓴다.
 * 시간을 쓰는 것은 실제로 글을 짓는 한 번뿐이고, 그 한 번에는 남은 시간을
 * 거의 다 준다.
 *
 * 한때 "살아 있는지 짧게 찔러 보고 들어가는" 단계를 뒀다가 뺐다. 503 은
 * 어차피 1초 안에 떨어지므로 진짜 요청으로 확인하는 것과 비용이 같고,
 * **멀쩡한 경우에만 왕복이 하나 더 는다.**
 */
async function generateWithFallback(
  prompt: string,
  useSearch: boolean,
  left: () => number,
  label: string
): Promise<CardNews> {
  let lastError: unknown = new Error("쓸 수 있는 모델이 없습니다.");
  const models = await usableModels();

  for (const model of models) {
    if (left() < ATTEMPT_NEEDS_MS) break;

    try {
      const result = await generateOnce(
        model,
        prompt,
        useSearch,
        AbortSignal.timeout(Math.max(left() - RESPONSE_RESERVE_MS, 1_000))
      );
      console.info(`[generate] ${label} 성공 · ${model}`);
      return result;
    } catch (error) {
      if (!isModelUnavailable(error)) throw error;
      console.warn(`[generate] ${model} 사용 불가, 다음 모델로:`, error);
      lastError = error;
    }
  }
  throw lastError;
}

export async function POST(request: Request) {
  const startedAt = Date.now();
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
  console.info(
    `[generate] 본문 ${article.length}자, 검색 ${useSearch ? "사용" : "안 함"}, 읽기 ${Date.now() - startedAt}ms`
  );

  const left = () => BUDGET_MS - (Date.now() - startedAt);

  // 검색 도구를 켜면 응답 스키마를 강제할 수 없어 형식이 틀어질 때가 있다.
  // 형식 문제로만 한 번 더 시도하고, 그래도 실패하면 오류로 돌려준다.
  try {
    const result = await generateWithFallback(prompt, useSearch, left, "1차");
    console.info(`[generate] 1차 완료, ${Date.now() - startedAt}ms`);
    return Response.json(result);
  } catch (firstError) {
    console.warn(`[generate] 1차 실패 (${Date.now() - startedAt}ms):`, firstError);

    // 남은 시간이 모자라면 재시도하지 않는다. 시작해 봐야 중간에 잘리고,
    // 그러면 플랫폼이 함수를 죽여 오류조차 제대로 못 돌려준다.
    if (left() < RETRY_NEEDS_MS) {
      console.error(`[generate] 시간이 모자라 재시도를 건너뜀 (${Date.now() - startedAt}ms)`);
      return Response.json(
        {
          error: "생성이 제한 시간을 넘었습니다.",
          detail: `TIMEOUT: ${Math.round((Date.now() - startedAt) / 1000)}초 걸렸습니다. 기사가 길거나 서버가 느린 경우입니다.`,
        },
        { status: 504 }
      );
    }

    try {
      const stricter = `${prompt}\n\n[재시도 안내]\n직전 응답이 형식에 맞지 않았습니다. 여는 중괄호로 시작해 닫는 중괄호로 끝나는 JSON 하나만, 다른 글자 없이 출력하세요.`;
      const result = await generateWithFallback(stricter, useSearch, left, "재시도");
      console.info(`[generate] 재시도 완료, ${Date.now() - startedAt}ms`);
      return Response.json(result);
    } catch (error) {
      console.error(`[generate] 최종 실패 (${Date.now() - startedAt}ms):`, error);
      const message = error instanceof Error ? error.message : "알 수 없는 오류";
      const timedOut = message.includes("abort") || message.includes("timed out");
      return Response.json(
        {
          error: timedOut ? "생성이 제한 시간을 넘었습니다." : "카드뉴스 생성에 실패했습니다.",
          detail: timedOut ? `TIMEOUT: ${message}` : message,
        },
        { status: timedOut ? 504 : 500 }
      );
    }
  }
}
