/**
 * 카드 배경 사진을 찾는다. 서버에서만 쓴다.
 *
 * **위키미디어 공용(Commons)에서만 찾는다.** 사용자는 "구글에서 저작권 문제
 * 없는 이미지"를 원했지만, 구글 이미지 검색 결과에는 라이선스가 붙어 있지
 * 않아 코드가 저작권을 확인할 수 없다(사용 권한 필터도 별도 API 키가 필요하고,
 * 구글 스스로 "라이선스는 원본에서 확인하라"고 한다). Commons 는 모든 파일에
 * 라이선스가 기계가 읽을 수 있게 붙어 있다. 그중 **상업적 사용이 되는 것**만
 * 쓴다. Unsplash 는 사용자 요청으로 쓰지 않는다.
 *
 * 제작 규칙(SKILL.md 2절)의 금지 항목 — 보도용 배포 사진, 유료 스톡 — 은
 * Commons 에 원칙적으로 없다. 혹시 섞이더라도 라이선스 표기가 없으면 버린다.
 */

/** 검색할 곳. 시험할 때 가짜 서버로 바꿀 수 있게 환경 변수로 둔다. */
const COMMONS_API = process.env.COMMONS_API_URL || "https://commons.wikimedia.org/w/api.php";

/** 받은 사진 주소가 이 호스트일 때만 내려준다(`/api/photo` 의 허용 목록). */
export const PHOTO_HOSTS = (process.env.PHOTO_HOSTS || "upload.wikimedia.org").split(",");

/** 위키미디어는 봇 요청에 연락처가 담긴 User-Agent 를 요구한다. */
export const WIKI_UA = "CardGenAI/1.0 (https://newsletter-woad-seven.vercel.app)";

export interface FoundPhoto {
  /** 우리 서버를 거치는 주소(`/api/photo?src=…`). PNG 로 구울 때 같은 출처여야 한다. */
  url: string;
  /** 카드와 캡션에 적는 표기. "작가 · 라이선스" */
  credit: string;
  license: string;
  /** 원본 파일 페이지. 라이선스 확인용. */
  pageUrl: string;
}

/**
 * 쓸 수 있는 라이선스. 상업적 사용이 되는 것만.
 * CC BY·BY-SA 는 작가 표기가 의무라 `credit` 을 카드와 캡션에 반드시 싣는다.
 * NC(비영리)·ND(변경 금지)는 받지 않는다 — ND 는 그라데이션을 덮는 것도 변경이다.
 */
const OK_LICENSE = /^(cc0|cc-zero|public domain|pd\b|pd-|cc by(-sa)? \d|cc-by(-sa)?-\d)/i;
const BAD_LICENSE = /\b(nc|nd)\b|non-?commercial|no ?deriv|fair use/i;

/** 배경으로 못 쓰는 것. 로고·지도·문장(紋章)·도표는 사진이 아니다. */
const NOT_A_PHOTO = /(logo|map|flag|coat of arms|emblem|seal|diagram|chart|icon|symbol|signature|poster|screenshot)/i;

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

interface CommonsPage {
  title?: string;
  imageinfo?: {
    thumburl?: string;
    url?: string;
    descriptionurl?: string;
    mime?: string;
    width?: number;
    height?: number;
    extmetadata?: Record<string, { value?: string }>;
  }[];
}

async function searchOnce(query: string, signal: AbortSignal): Promise<FoundPhoto | null> {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    generator: "search",
    // filetype:bitmap 으로 SVG(대개 로고·도표)를 처음부터 뺀다.
    gsrsearch: `${query} filetype:bitmap`,
    gsrnamespace: "6",
    gsrlimit: "12",
    prop: "imageinfo",
    iiprop: "url|mime|size|extmetadata",
    iiurlwidth: "1350",
  });
  const res = await fetch(`${COMMONS_API}?${params}`, {
    headers: { "User-Agent": WIKI_UA },
    signal,
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { query?: { pages?: Record<string, CommonsPage & { index?: number }> } };
  const pages = Object.values(data.query?.pages ?? {}).sort((a, b) => (a.index ?? 0) - (b.index ?? 0));

  for (const page of pages) {
    const info = page.imageinfo?.[0];
    if (!info?.thumburl || !info.descriptionurl) continue;
    if (!/^image\/(jpeg|png)$/.test(info.mime ?? "")) continue;
    // 카드 한 장(1080×1350)을 덮을 만큼은 커야 한다. 작으면 뭉개진다.
    if ((info.width ?? 0) < 1000 || (info.height ?? 0) < 700) continue;
    if (NOT_A_PHOTO.test(page.title ?? "")) continue;

    const meta = info.extmetadata ?? {};
    const license = stripHtml(meta.LicenseShortName?.value ?? "");
    if (!OK_LICENSE.test(license) || BAD_LICENSE.test(license)) continue;
    // 초상권·상표 같은 추가 제한이 표시된 파일은 쓰지 않는다.
    if (stripHtml(meta.Restrictions?.value ?? "")) continue;

    let host: string;
    try {
      host = new URL(info.thumburl).hostname;
    } catch {
      continue;
    }
    if (!PHOTO_HOSTS.includes(host)) continue;

    const artist = stripHtml(meta.Artist?.value ?? "") || "작자 미상";
    return {
      url: `/api/photo?src=${encodeURIComponent(info.thumburl)}`,
      credit: `${artist.slice(0, 60)} · ${license}`,
      license,
      pageUrl: info.descriptionurl,
    };
  }
  return null;
}

/**
 * 검색어를 차례로 써 본다. 하나도 못 찾으면 null — 템플릿은 사진 없이
 * 그라데이션으로 그린다. 사진 때문에 생성이 실패하면 안 된다.
 */
export async function findPhoto(queries: string[], timeoutMs = 6_000): Promise<FoundPhoto | null> {
  const signal = AbortSignal.timeout(timeoutMs);
  for (const q of queries.map((s) => s.trim()).filter(Boolean)) {
    try {
      const found = await searchOnce(q, signal);
      if (found) return found;
    } catch (error) {
      console.warn(`[photo] "${q}" 검색 실패:`, error);
      if (signal.aborted) break;
    }
  }
  return null;
}
