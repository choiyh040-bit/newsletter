import { PHOTO_HOSTS, pixabayImageUrl, WIKI_UA } from "@/lib/photo";

/**
 * 카드 배경 사진을 우리 서버를 거쳐 내려준다.
 *
 * 카드를 PNG 로 구울 때(html-to-image) 다른 출처의 사진은 브라우저가 막을 수
 * 있다(CORS). 같은 출처로 받으면 그 걱정이 없다. 아무 주소나 대신 받아 주면
 * 남의 서버를 두드리는 통로가 되므로, 사진 검색이 돌려준 호스트만 받는다.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  // 픽사베이는 번호로 받는다. 사진 주소가 한동안만 살아 있어서 그릴 때마다
  // 새 주소를 받는다(lib/photo.ts 의 pixabayImageUrl).
  const pixabayId = params.get("pixabay");
  const src = pixabayId ? ((await pixabayImageUrl(pixabayId)) ?? "") : (params.get("src") ?? "");
  let target: URL;
  try {
    target = new URL(src);
  } catch {
    return new Response("잘못된 주소", { status: 400 });
  }
  if (target.protocol !== "https:" && process.env.NODE_ENV === "production") {
    return new Response("https 만 받습니다", { status: 400 });
  }
  if (!PHOTO_HOSTS.includes(target.hostname)) {
    return new Response("허용하지 않은 주소", { status: 403 });
  }

  const res = await fetch(target, {
    headers: { "User-Agent": WIKI_UA },
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null);
  const type = res?.headers.get("content-type") ?? "";
  if (!res || !res.ok || !/^image\/(jpeg|png)/.test(type)) {
    return new Response("사진을 받지 못했습니다", { status: 502 });
  }
  return new Response(res.body, {
    headers: {
      "Content-Type": type,
      // 같은 사진은 바뀌지 않는다(파일 주소에 해시가 들어 있다). 오래 둔다.
      "Cache-Control": "public, max-age=604800, immutable",
    },
  });
}
