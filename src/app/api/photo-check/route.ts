/**
 * 사진 검색 점검. 키가 서버에 들어갔는지, 각 곳의 시험 검색이 되는지 알려 준다.
 *
 * 키를 Vercel 에 넣고도 사진이 계속 위키미디어에서 왔다(2026-10-16). 배포 서버
 * 안은 이 작업 환경에서 볼 수 없어서 만들었다. **키 값은 절대 내보내지 않는다.**
 * 있는지 여부, 응답 상태 코드, 찾은 개수, 오류 문구(앞 120자)만 준다.
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

export async function GET() {
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

  return Response.json(
    {
      pixabay: { keySet: !!pixabayKey, keyLength: pixabayKey?.length ?? 0, test: pixabay },
      unsplash: { keySet: !!unsplashKey, keyLength: unsplashKey?.length ?? 0, test: unsplash },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
