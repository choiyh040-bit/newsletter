import { GoogleGenAI, ThinkingLevel } from "@google/genai";

/**
 * 자료 수집(`/api/research`)과 생성(`/api/generate`)이 함께 쓰는 Gemini 호출부.
 *
 * 두 단계를 **요청 하나에서 잇달아 하던 것을 요청 둘로 나눴다.** 한 요청의
 * 시간 예산(55초)에 검색 14~26초와 생성 24~27초를 함께 넣으니 합이 넘쳤다.
 * 요청을 나누면 단계마다 예산을 온전히 쓴다. 예산 숫자 자체는 그대로다.
 */

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
 *
 * **flash-lite 만 쓴다.** 예전에는 flash → lite → pro 순이었는데, 결제를
 * 붙인 뒤 재 보니 flash(3.8)는 생성 한 번에 24~30초였다. 시간은 대부분
 * 생각(생각 토큰 2776)에 쓰였다. lite 에 생각 수준 LOW 를 고정하면 짧은
 * 답이 1초다. lite 가 전부 막히는 일이 로그로 실제 보이면 그때 flash 를
 * 맨 뒤에 붙인다. 미리 붙이지 않은 것은 그 한 번이 다시 30초가 되기 때문이다.
 */

/** 글을 짓는 데 못 쓰는 것들. 이름에 이게 들어가면 뺀다. */
const NOT_FOR_TEXT =
  /(image|tts|transcribe|audio|live|computer-use|robotics|omni|embedding|customtools|nano-banana|lyria|antigravity|deep-research)/;

/** 목록을 못 받아 왔을 때 쓸 최소한의 이름. */
const FALLBACK_MODELS = ["gemini-flash-lite-latest"];

/** 몇 개까지 차례로 써 볼지. */
const MAX_MODELS = 4;

/**
 * 순위를 매긴다. 작을수록 먼저 쓴다. null 이면 안 쓴다.
 * 버전이 높은 것을 먼저 쓴다. 버전 없는 별칭(gemini-flash-lite-latest)은
 * 0 이 되어 맨 뒤로 간다.
 */
function rankModel(name: string, tier: Tier): number | null {
  if (!name.startsWith("gemini-")) return null;
  if (NOT_FOR_TEXT.test(name)) return null;
  if (!name.includes("flash")) return null;
  if ((tier === "lite") !== name.includes("flash-lite")) return null;
  return -Number(/gemini-(\d+(?:\.\d+)?)/.exec(name)?.[1] ?? 0);
}

/**
 * 모델 등급. 생성은 lite 만 쓴다(위 설명).
 *
 * **검색 단계만 flash 를 먼저 쓴다**(2026-10-15). lite 는 검색을 하고도
 * 검색 근거(기사 주소 목록, `groundingChunks`)를 **한 번도 보내 주지 않았다**
 * (생각 수준 LOW·MINIMAL·설정 없음 모두 0건). flash 는 보낸다. 주소가 없으면
 * 키워드로 만든 카드뉴스에 출처 주소를 붙일 수 없다. 대신 검색이 2초에서
 * 6초 남짓으로 는다. flash 가 다 막히면 lite 로 넘어가고, 그때는 주소 없이
 * 만든다.
 */
export type Tier = "lite" | "flash";

/** flash 등급에서 몇 개까지 먼저 써 볼지. 그 뒤로는 lite 로 넘어간다. */
const FLASH_FIRST = 2;

/**
 * 생각 수준. 모든 호출에 고정한다.
 *
 * 이 설정을 모르는 모델은 400 으로 거부할 수 있다. 그건 모델을 바꾸면
 * 풀리는 실패이므로 `isModelUnavailable` 이 다음 모델로 넘긴다.
 */
export const THINKING = { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } };

/**
 * 목록은 자주 바뀌지 않으므로 잠깐 재사용한다. 서버리스 인스턴스가 살아
 * 있는 동안만 유효하고, 사라지면 그냥 다시 받는다.
 */
let modelCache: { at: number; models: Record<Tier, string[]> } | null = null;
const MODEL_CACHE_MS = 10 * 60_000;

async function usableModels(tier: Tier): Promise<string[]> {
  const pick = (m: Record<Tier, string[]>) =>
    tier === "flash" ? [...m.flash.slice(0, FLASH_FIRST), ...m.lite] : m.lite;
  if (modelCache && Date.now() - modelCache.at < MODEL_CACHE_MS) {
    return pick(modelCache.models);
  }
  try {
    const names: string[] = [];
    for await (const model of await client().models.list()) {
      const name = (model.name ?? "").replace(/^models\//, "");
      // 글을 짓는 데 쓸 수 있다고 스스로 밝힌 것만 본다.
      if (!model.supportedActions?.includes("generateContent")) continue;
      names.push(name);
    }
    const rank = (t: Tier) =>
      names
        .filter((n) => rankModel(n, t) !== null)
        .sort((a, b) => rankModel(a, t)! - rankModel(b, t)!)
        .slice(0, MAX_MODELS);
    const models = { lite: rank("lite"), flash: rank("flash") };

    if (models.lite.length === 0) return FALLBACK_MODELS;
    modelCache = { at: Date.now(), models };
    console.info(`[gemini] 쓸 수 있는 모델 lite: ${models.lite.join(", ")} / flash: ${models.flash.join(", ")}`);
    return pick(models);
  } catch (error) {
    console.warn("[gemini] 모델 목록을 못 받아 왔습니다. 기본값을 씁니다:", error);
    return FALLBACK_MODELS;
  }
}

/** 한 모델을 시도하려면 최소 이만큼 남아 있어야 한다. */
const ATTEMPT_NEEDS_MS = 12_000;

/** 응답을 만들어 돌려주려고 남겨 두는 시간. */
const RESPONSE_RESERVE_MS = 3_000;

/**
 * 한 번의 호출에 줄 수 있는 최대 시간.
 *
 * 이 값을 두 번 틀렸다. 처음에는 42초로 뒀다가, 멀쩡한 생성이 잘린다고
 * 보고 아예 없앴다. 둘 다 진단이 틀렸다.
 *
 * **같은 모델에 같은 짧은 기사를 넣고 두 번 재 보니 4.8초와 52초(무응답)
 * 였다.** 느린 것이 아니라 **가끔 먹통이 된다.** 그러니 상한은 "느린 성공을
 * 기다려 주는 선"이 아니라 "먹통을 알아채는 선"으로 잡아야 한다.
 *
 * 32초면 먹통을 끊고 나서 **다음 모델을 써 볼 시간이 20초쯤 남는다.**
 */
const ATTEMPT_MAX_MS = 32_000;

/**
 * 한 요청에 쓸 수 있는 시간.
 *
 * `maxDuration` 보다 짧게 잡는다. 상한을 넘기면 Vercel 이 함수를 죽이는데,
 * 그때 돌아오는 것은 **우리 JSON 이 아니라 플랫폼의 오류 페이지**다. 화면은
 * 그걸 JSON 으로 읽으려다 엉뚱한 구문 오류를 띄우고, 진짜 원인(시간 초과)은
 * 어디에도 안 남는다. 죽기 전에 우리가 먼저 끝내고 제대로 된 오류를 돌려준다.
 */
const BUDGET_MS = 55_000;

/** 요청이 시작된 시각부터 남은 시간을 재는 함수를 만든다. */
export function startBudget(): () => number {
  const startedAt = Date.now();
  return () => BUDGET_MS - (Date.now() - startedAt);
}

/** 시간이 다해 끊긴 호출인지. */
export function isAbort(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    (error instanceof Error && error.name === "AbortError") ||
    message.includes("abort") ||
    message.includes("timed out")
  );
}

/**
 * 다음 모델로 넘어갈 만한 실패인지.
 *
 * 넘어갈 것: 용량 부족(503), 쿼터(429 — 모델마다 따로 걸린다), 단종(404),
 * 그리고 **생각 수준 설정을 거부한 400.** 400 은 원래 "모델을 바꿔도 같다"로
 * 보고 멈췄는데, 생각 설정을 고정한 뒤로는 모델마다 받는 것이 다를 수 있다.
 * 그 하나 때문에 체인 전체가 멈추면 안 된다.
 * 넘어가지 않을 것: 인증(401·403)과 그 밖의 잘못된 요청(400).
 * 우리가 던지는 형식 오류도 여기 해당하지 않는다. 그건 바깥의 재시도가
 * 더 엄한 프롬프트로 다시 부른다.
 */
function isModelUnavailable(error: unknown): boolean {
  if (error instanceof TryNextModel) return true;
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("UNAVAILABLE") ||
    message.includes("RESOURCE_EXHAUSTED") ||
    message.includes("NOT_FOUND") ||
    message.includes("overloaded") ||
    message.includes("high demand") ||
    (message.includes("INVALID_ARGUMENT") && /thinking/i.test(message))
  );
}

/**
 * 이 모델의 답이 쓸모없었으니 다음 모델로 넘기라는 뜻의 오류.
 *
 * lite 모델에 생각 수준 LOW 를 고정하니, 검색 도구를 붙여도 **검색을 안 하고
 * 기억으로 답할 때가 있었다**(같은 키워드로 한 번은 안 하고 한 번은 했다).
 * 오류 응답은 아니지만 근거로 쓸 수 없으니, 503 처럼 다음 모델로 넘긴다.
 */
export class TryNextModel extends Error {}

export function client() {
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

/**
 * 모델을 차례로 시도한다. 붐비거나 먹통인 모델을 만나면 다음으로 넘어간다.
 *
 * 붐비는 응답은 대개 빨리 돌아오지만 **늘 그렇지는 않다** — 503 하나가
 * 10.8초 걸린 적이 있다. 시간을 쓰는 것은 주로 실제로 답을 짓는 한 번이고,
 * 그 한 번에는 남은 시간을 거의 다 준다.
 */
export async function withFallback<T>(
  run: (model: string, signal: AbortSignal) => Promise<T>,
  left: () => number,
  label: string,
  tier: Tier = "lite"
): Promise<T> {
  let lastError: unknown = new Error("쓸 수 있는 모델이 없습니다.");
  const models = await usableModels(tier);

  for (const model of models) {
    if (left() < ATTEMPT_NEEDS_MS) break;

    // 시도마다 몇 초 걸렸는지 남긴다. 이게 없어서 "46초가 걸렸다"를 놓고
    // 503 을 거친 시간인지 한 번의 생성이 느린 것인지 세 번이나 추정만 했다.
    // 합계만 있으면 어디를 고쳐야 할지 알 수 없다.
    const cap = Math.max(Math.min(left() - RESPONSE_RESERVE_MS, ATTEMPT_MAX_MS), 1_000);
    const attemptAt = Date.now();
    const took = () => `${Date.now() - attemptAt}ms/상한 ${cap}ms`;

    try {
      const result = await run(model, AbortSignal.timeout(cap));
      console.info(`[gemini] ${label} 성공 · ${model} (${took()})`);
      return result;
    } catch (error) {
      // 상한에 걸려 끊긴 것(먹통)도 다음 모델로 넘어갈 일이다. 예전에는
      // 이걸 안 가려서, 먹통 하나를 만나면 **남은 모델을 하나도 안 써 보고**
      // 그대로 실패했다. 전체 예산이 다한 것인지 이 시도만 끊긴 것인지는
      // 남은 시간으로 구분한다.
      const abortedThisAttempt =
        isAbort(error) && left() > ATTEMPT_NEEDS_MS + RESPONSE_RESERVE_MS;

      // 예산이 다해 끊긴 마지막 시도도 모델 이름을 남긴다. 전에는 이 줄이
      // 없어서 "어느 모델이 상한에 걸렸나"를 순서로 추정해야 했다.
      if (!isModelUnavailable(error) && !abortedThisAttempt) {
        console.warn(`[gemini] ${label} 실패 · ${model} (${took()}):`, error);
        throw error;
      }
      console.warn(
        `[gemini] ${label} ${model} ${abortedThisAttempt ? "응답 없음(끊음)" : "사용 불가"} (${took()}), 다음 모델로:`,
        error
      );
      // "검색 결과가 비었다" 같은 우리 판단이 단종(404) 같은 뒤 모델의 사정에
      // 덮이지 않게 한다. 화면에는 앞의 것이 더 쓸모 있다.
      if (!(lastError instanceof TryNextModel)) lastError = error;
    }
  }
  throw lastError;
}

/** 실패를 화면이 읽을 수 있는 JSON 오류로 바꾼다. */
export function failure(error: unknown, what: string): Response {
  const message = error instanceof Error ? error.message : "알 수 없는 오류";
  const timedOut = isAbort(error);
  return Response.json(
    {
      error: timedOut ? `${what}이 제한 시간을 넘었습니다.` : `${what}에 실패했습니다.`,
      detail: timedOut ? `TIMEOUT: ${message}` : message,
    },
    { status: timedOut ? 504 : 500 }
  );
}
