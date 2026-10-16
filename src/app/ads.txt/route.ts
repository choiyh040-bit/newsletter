import { ADSENSE_CLIENT } from "@/lib/site";

/**
 * /ads.txt — 이 사이트에 광고를 실을 수 있는 판매자를 밝히는 파일. 애드센스가
 * 사이트 소유 확인과 광고 판매에 쓴다. 게시자 번호가 없으면 404 다.
 *
 * `ca-pub-123…` 의 `pub-123…` 부분이 들어간다. 끝의 값은 구글의 인증 기관 ID 로 고정이다.
 */
export function GET() {
  if (!ADSENSE_CLIENT) return new Response("Not Found", { status: 404 });
  const publisher = ADSENSE_CLIENT.replace(/^ca-/, "");
  return new Response(`google.com, ${publisher}, DIRECT, f08c47fec0942fa0\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
