import { findPhoto } from "@/lib/photo";

/**
 * 미리보기의 "다른 사진" 버튼. 같은 검색어로, 이미 본 사진은 빼고 하나 더 찾는다.
 *
 * 생성할 때 고른 사진이 마음에 안 들 때 쓴다. 검색 결과 앞쪽 몇 장 중에서
 * 무작위로 고르므로 누를 때마다 다른 사진이 온다. 앞쪽 후보를 다 보면
 * 다음 곳(언스플래쉬 → 위키미디어)으로 넘어가고, 그것도 다 보면 null 이다.
 */
export async function POST(request: Request) {
  let query = "";
  let exclude: string[] = [];
  try {
    const body = await request.json();
    query = typeof body.query === "string" ? body.query.trim().slice(0, 80) : "";
    exclude = Array.isArray(body.exclude)
      ? body.exclude.filter((x: unknown): x is string => typeof x === "string").slice(-30)
      : [];
  } catch {
    return Response.json({ error: "요청 본문을 읽을 수 없습니다." }, { status: 400 });
  }
  if (!query) return Response.json({ error: "검색어가 없습니다." }, { status: 400 });

  const photo = await findPhoto([query], 8_000, exclude);
  return Response.json({ photo });
}
