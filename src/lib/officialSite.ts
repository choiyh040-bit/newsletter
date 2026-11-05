import * as cheerio from "cheerio";
import { pressName } from "./pressNames";

/** 출처 하나. 카드뉴스 결과의 `source` 와 같은 모양이다. */
export interface Link {
  name: string;
  url: string;
}

/** 주소의 사이트 이름(www. 뺀 호스트). 못 읽으면 "". */
export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

/** 페이지 제목에서 사이트 이름만. "국립중앙박물관 | 전시" → "국립중앙박물관". */
function siteTitle(html: string): string {
  const raw = cheerio.load(html)("title").first().text().trim();
  return raw.split(/\s[|\-–:·]\s/)[0].trim().slice(0, 30);
}

/**
 * 홍보형의 "자세히 보기" 링크로 **공식 사이트**를 고른다(2026-11-05 사용자: "공식 사이트 우선").
 *
 * 모델이 적은 "공식 사이트:" 주소는 지어낸 것일 수 있다. 그래서 ① 검색 근거 중 같은 사이트가 있으면 그것,
 * ② 없으면 그 주소가 **실제로 열리는지** 서버가 확인한 뒤에만 쓴다. 둘 다 아니면 원래처럼 첫 근거.
 */
export async function pickOfficial(
  text: string,
  candidates: Link[],
  { notSource, timeoutMs, fetcher = fetch }: { notSource: RegExp; timeoutMs: number; fetcher?: typeof fetch }
): Promise<Link[]> {
  const claimed = text.match(/공식\s*사이트\s*[:：]\s*(https?:\/\/[^\s)]+|[a-z0-9.-]+\.[a-z]{2,}[^\s)]*)/i)?.[1];
  if (!claimed) return candidates;
  const url = /^https?:\/\//.test(claimed) ? claimed : `https://${claimed}`;
  const host = hostOf(url);
  if (!host || notSource.test(host)) return candidates;
  const same = candidates.find((c) => hostOf(c.url) === host || hostOf(c.url).endsWith("." + host));
  if (same) return [same, ...candidates.filter((c) => c !== same)];
  try {
    const res = await fetcher(url, { redirect: "follow", signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) return candidates;
    const title = siteTitle(await res.text());
    const official = { name: pressName(res.url) ?? (title || hostOf(res.url)), url: res.url };
    return [official, ...candidates];
  } catch {
    return candidates;
  }
}
