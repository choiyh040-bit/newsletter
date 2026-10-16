/**
 * 카드 배경 사진을 찾는다. 서버에서만 쓴다.
 *
 * 찾는 곳은 세 군데이고 **이 순서로** 본다(2026-10-16).
 *
 * 1. 픽사베이 — `PIXABAY_API_KEY` 가 있을 때만
 * 2. 언스플래쉬 — `UNSPLASH_ACCESS_KEY` 가 있을 때만
 * 3. 위키미디어 공용 — 키 없이 늘
 *
 * 스톡 두 곳을 앞에 둔 것은 "일반적인 행사장 컷"을 위키미디어보다 훨씬 잘
 * 찾기 때문이다. 둘 다 상업적 사용이 되는 라이선스다. 처음에는 사용자가
 * 언스플래쉬를 빼 달라고 해서 위키미디어만 썼는데, 이후 "보편적인 스톡 컷이면
 * 된다"며 허용했다. 키가 없으면 그 곳은 건너뛴다 — 키를 넣기 전에도 지금처럼
 * 위키미디어로 돈다.
 *
 * 구글 이미지 검색은 쓰지 않는다. 결과에 라이선스가 없어 저작권을 코드로
 * 확인할 수 없다. 아이스탁은 프로그램으로 검색·내려받기가 열려 있지 않아
 * 사용자가 직접 받아 올린다(미리보기의 "내 사진 올리기").
 *
 * 제작 규칙(SKILL.md 2절)의 금지 항목 — 보도용 배포 사진, 유료 스톡 워터마크 —
 * 은 세 곳 모두 원칙적으로 없다.
 */

/** 검색할 곳. 시험할 때 가짜 서버로 바꿀 수 있게 환경 변수로 둔다. */
const COMMONS_API = process.env.COMMONS_API_URL || "https://commons.wikimedia.org/w/api.php";
const PIXABAY_API = process.env.PIXABAY_API_URL || "https://pixabay.com/api/";
const UNSPLASH_API = process.env.UNSPLASH_API_URL || "https://api.unsplash.com";

/** 받은 사진 주소가 이 호스트일 때만 내려준다(`/api/photo` 의 허용 목록). */
export const PHOTO_HOSTS = (
  process.env.PHOTO_HOSTS || "upload.wikimedia.org,images.unsplash.com,pixabay.com,cdn.pixabay.com"
).split(",");

/** 위키미디어는 봇 요청에 연락처가 담긴 User-Agent 를 요구한다. */
export const WIKI_UA = "CardGenAI/1.0 (https://newsletter-woad-seven.vercel.app)";

export interface FoundPhoto {
  /** 우리 서버를 거치는 주소(`/api/photo?…`). PNG 로 구울 때 같은 출처여야 한다. */
  url: string;
  /** 작가. 카드와 캡션에 "사진 · 작가 · 라이선스 · 출처" 로 적는다. */
  credit: string;
  license: string;
  /** 원본 사진 페이지. */
  pageUrl: string;
  /** 어디서 왔는지. 카드·캡션 표기에 쓴다. */
  source: "Pixabay" | "Unsplash" | "Wikimedia Commons";
}

/** 배경으로 못 쓰는 것. 로고·지도·문장(紋章)·도표는 사진이 아니다. */
const NOT_A_PHOTO = /(logo|map|flag|coat of arms|emblem|seal|diagram|chart|icon|symbol|signature|poster|screenshot)/i;

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function allowedHost(url: string): boolean {
  try {
    return PHOTO_HOSTS.includes(new URL(url).hostname);
  } catch {
    return false;
  }
}

// ─── 픽사베이 ────────────────────────────────────────────────────────────────

interface PixabayHit {
  id: number;
  pageURL?: string;
  largeImageURL?: string;
  imageWidth?: number;
  imageHeight?: number;
  user?: string;
}

async function pixabayQuery(params: Record<string, string>, signal?: AbortSignal) {
  const key = process.env.PIXABAY_API_KEY;
  if (!key) return null;
  const res = await fetch(`${PIXABAY_API}?${new URLSearchParams({ key, ...params })}`, { signal });
  if (!res.ok) return null;
  return ((await res.json()) as { hits?: PixabayHit[] }).hits ?? [];
}

/**
 * 픽사베이 사진의 지금 주소. `/api/photo?pixabay=번호` 가 부른다.
 *
 * 픽사베이가 주는 사진 주소는 **한동안만 살아 있다**(오래 걸어 두는 것도
 * 금지). 주소를 저장하면 며칠 뒤 열었을 때 사진이 깨진다. 그래서 결과에는
 * 사진 번호만 남기고, 그릴 때마다 번호로 새 주소를 받는다.
 */
export async function pixabayImageUrl(id: string): Promise<string | null> {
  if (!/^\d+$/.test(id)) return null;
  const hits = await pixabayQuery({ id }, AbortSignal.timeout(5_000));
  const url = hits?.[0]?.largeImageURL;
  return url && allowedHost(url) ? url : null;
}

async function searchPixabay(query: string, signal: AbortSignal): Promise<FoundPhoto | null> {
  const hits = await pixabayQuery(
    { q: query, image_type: "photo", safesearch: "true", per_page: "12", min_width: "1000" },
    signal
  );
  for (const hit of hits ?? []) {
    if ((hit.imageWidth ?? 0) < 1000 || (hit.imageHeight ?? 0) < 700) continue;
    if (!hit.largeImageURL || !allowedHost(hit.largeImageURL)) continue;
    return {
      url: `/api/photo?pixabay=${hit.id}`,
      credit: hit.user || "Pixabay",
      license: "Pixabay Content License",
      pageUrl: hit.pageURL ?? "https://pixabay.com",
      source: "Pixabay",
    };
  }
  return null;
}

// ─── 언스플래쉬 ──────────────────────────────────────────────────────────────

interface UnsplashPhoto {
  width?: number;
  height?: number;
  urls?: { raw?: string; regular?: string };
  links?: { html?: string; download_location?: string };
  user?: { name?: string };
}

async function searchUnsplash(query: string, signal: AbortSignal): Promise<FoundPhoto | null> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return null;
  const headers = { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" };
  const params = new URLSearchParams({ query, per_page: "12", content_filter: "high" });
  const res = await fetch(`${UNSPLASH_API}/search/photos?${params}`, { headers, signal });
  if (!res.ok) return null;
  const results = ((await res.json()) as { results?: UnsplashPhoto[] }).results ?? [];
  for (const photo of results) {
    if ((photo.width ?? 0) < 1000 || (photo.height ?? 0) < 700) continue;
    const raw = photo.urls?.raw;
    if (!raw || !allowedHost(raw)) continue;
    // 카드 크기에 맞춰 잘라 받는다(언스플래쉬 주소 변수).
    const sized = `${raw}${raw.includes("?") ? "&" : "?"}w=1080&h=1350&fit=crop&q=80&fm=jpg`;
    // 언스플래쉬 API 규정: 사진을 쓰기로 했으면 download_location 을 한 번
    // 불러 알려야 한다. 실패해도 사진은 쓴다(알림일 뿐).
    if (photo.links?.download_location) {
      await fetch(photo.links.download_location, { headers, signal }).catch(() => {});
    }
    return {
      url: `/api/photo?src=${encodeURIComponent(sized)}`,
      credit: photo.user?.name || "Unsplash",
      license: "Unsplash License",
      pageUrl: photo.links?.html ?? "https://unsplash.com",
      source: "Unsplash",
    };
  }
  return null;
}

// ─── 위키미디어 공용 ─────────────────────────────────────────────────────────

/**
 * 쓸 수 있는 라이선스. 상업적 사용이 되는 것만.
 * CC BY·BY-SA 는 작가 표기가 의무라 `credit` 을 카드와 캡션에 반드시 싣는다.
 * NC(비영리)·ND(변경 금지)는 받지 않는다 — ND 는 그라데이션을 덮는 것도 변경이다.
 */
const OK_LICENSE = /^(cc0|cc-zero|public domain|pd\b|pd-|cc by(-sa)? \d|cc-by(-sa)?-\d)/i;
const BAD_LICENSE = /\b(nc|nd)\b|non-?commercial|no ?deriv|fair use/i;

interface CommonsPage {
  title?: string;
  index?: number;
  imageinfo?: {
    thumburl?: string;
    descriptionurl?: string;
    mime?: string;
    width?: number;
    height?: number;
    extmetadata?: Record<string, { value?: string }>;
  }[];
}

async function searchCommons(query: string, signal: AbortSignal): Promise<FoundPhoto | null> {
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
  const data = (await res.json()) as { query?: { pages?: Record<string, CommonsPage> } };
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
    if (!allowedHost(info.thumburl)) continue;

    const artist = stripHtml(meta.Artist?.value ?? "") || "작자 미상";
    return {
      url: `/api/photo?src=${encodeURIComponent(info.thumburl)}`,
      credit: artist.slice(0, 60),
      license,
      pageUrl: info.descriptionurl,
      source: "Wikimedia Commons",
    };
  }
  return null;
}

// ─── 차례로 찾기 ─────────────────────────────────────────────────────────────

const PROVIDERS: { name: string; search: typeof searchCommons }[] = [
  { name: "픽사베이", search: searchPixabay },
  { name: "언스플래쉬", search: searchUnsplash },
  { name: "위키미디어", search: searchCommons },
];

/**
 * 검색어마다 세 곳을 차례로 본다. 하나도 못 찾으면 null — 템플릿은 사진 없이
 * 그라데이션으로 그린다. 사진 때문에 생성이 실패하면 안 된다.
 */
export async function findPhoto(queries: string[], timeoutMs = 6_000): Promise<FoundPhoto | null> {
  const signal = AbortSignal.timeout(timeoutMs);
  for (const q of queries.map((s) => s.trim()).filter(Boolean)) {
    for (const provider of PROVIDERS) {
      if (signal.aborted) return null;
      try {
        const found = await provider.search(q, signal);
        if (found) return found;
      } catch (error) {
        console.warn(`[photo] ${provider.name} "${q}" 검색 실패:`, error);
      }
    }
  }
  return null;
}
