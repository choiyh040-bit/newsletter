/**
 * 사진 검색 점검. 키가 서버에 들어갔는지, 각 곳의 시험 검색이 되는지 알려 준다.
 *
 * 키를 Vercel 에 넣고도 사진이 계속 위키미디어에서 왔다(2026-10-16). 배포 서버
 * 안은 이 작업 환경에서 볼 수 없어서 만들었다. **키 값은 절대 내보내지 않는다.**
 * 있는지 여부, 응답 상태 코드, 찾은 개수, 오류 문구(앞 120자)만 준다.
 *
 * **결과는 10분 동안 기억한다.** 부를 때마다 두 곳에 시험 검색을 하므로, 누가 반복해서 부르면
 * 언스플래쉬 무료 한도(시간당 50회)를 써 버릴 수 있었다(2026-10-22). 기억해 두면 서버 한 대당
 * 시간당 최대 6번만 실제로 검색한다. 키를 바꾼 직후 바로 확인하려면 10분을 기다리거나 다시 배포한다
 * (다시 배포하면 기억이 비워진다).
 */
export const dynamic = "force-dynamic";

const PIXABAY_API = process.env.PIXABAY_API_URL || "https://pixabay.com/api/";
const UNSPLASH_API = process.env.UNSPLASH_API_URL || "https://api.unsplash.com";

async function check(run: () => Promise<Response>, count: (body: unknown) => number) {
  try {
    const res = await run();
    const text = await res.text();
    let found: number | null = null;
    try {
      found = count(JSON.parse(text));
    } catch {
      /* JSON 이 아니면 오류 문구로 본다 */
    }
    return { status: res.status, found, error: res.ok ? null : text.slice(0, 120) };
  } catch (error) {
    return { status: null, found: null, error: String(error).slice(0, 120) };
  }
}

const CACHE_MS = 10 * 60_000;
let cache: { at: number; body: unknown } | null = null;

export async function GET() {
  if (cache && Date.now() - cache.at < CACHE_MS) {
    return Response.json({ ...(cache.body as object), cached: true }, { headers: { "Cache-Control": "no-store" } });
  }
  const pixabayKey = process.env.PIXABAY_API_KEY?.trim();
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY?.trim();
  const timeout = () => AbortSignal.timeout(5_000);

  const pixabay = pixabayKey
    ? await check(
        () => fetch(`${PIXABAY_API}?${new URLSearchParams({ key: pixabayKey, q: "convention center", image_type: "photo", per_page: "3" })}`, { signal: timeout() }),
        (b) => ((b as { hits?: unknown[] }).hits ?? []).length
      )
    : null;
  const unsplash = unsplashKey
    ? await check(
        () => fetch(`${UNSPLASH_API}/search/photos?query=convention%20center&per_page=3`, {
          headers: { Authorization: `Client-ID ${unsplashKey}`, "Accept-Version": "v1" },
          signal: timeout(),
        }),
        (b) => ((b as { results?: unknown[] }).results ?? []).length
      )
    : null;

  const body = {
    checkedAt: new Date().toISOString(),
    pixabay: { keySet: !!pixabayKey, keyLength: pixabayKey?.length ?? 0, test: pixabay },
    unsplash: { keySet: !!unsplashKey, keyLength: unsplashKey?.length ?? 0, test: unsplash },
  };
  cache = { at: Date.now(), body };
  return Response.json({ ...body, cached: false }, { headers: { "Cache-Control": "no-store" } });
}
