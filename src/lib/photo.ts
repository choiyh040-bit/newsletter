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

/** 후보 하나. 고른 뒤에 할 일(언스플래쉬 사용 알림)을 함께 들고 다닌다. */
interface Candidate extends FoundPhoto {
  notify?: { url: string; headers: Record<string, string> };
}

/**
 * 특정 인물이 중심인 사진인지(설명·태그로 어림).
 *
 * 사용자 기준: **군중·청중은 되고, 특정 인물은 안 된다**(2026-10-16). 뷰티엑스포
 * 기사에 화장품을 든 모델 사진이 붙었는데, 라이선스상 문제는 없어도 그 사람이
 * 행사와 관련 있는 것처럼 보인다. 사진 내용은 코드가 볼 수 없으므로 사이트가
 * 주는 설명·태그의 낱말로 거른다. "crowd·audience·people" 같은 낱말이 있으면
 * 여럿이 나오는 장면으로 보고 남긴다.
 */
// 2026-10-16 패션 사진에서 "father, daughter"(아빠와 아이), "models, women"(런웨이 모델들)이
// 빠져나갔다. 가족·관계 낱말과 복수형을 더했다. 몇 명이든 **알아볼 수 있는 특정 인물**이면 뺀다.
const ONE_PERSON =
  /\b(woman|women|man|men|girls?|boys?|lady|ladies|guy|gentleman|portrait|models?|selfie|face|businessman|businesswoman|person|child|children|kids?|baby|babies|toddler|teen|teenager|bride|groom|couple|family|father|mother|dad|mom|daughter|son|husband|wife|grandmother|grandfather|friends)\b/i;
// 군중은 된다(사용자 기준). 다만 "people", "group", "team" 은 서너 명이 또렷이 나온 사진에도 붙어서
// 인물 낱말을 덮어 주는 근거로 쓰지 않는다.
const MANY_PEOPLE = /\b(crowd|crowded|audience|spectators|visitors|attendees|participants|delegates|gathering|festival|concert)\b/i;

function isOnePerson(text: string): boolean {
  return ONE_PERSON.test(text) && !MANY_PEOPLE.test(text);
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
  tags?: string;
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

async function searchPixabay(query: string, signal: AbortSignal): Promise<Candidate[]> {
  const hits = await pixabayQuery(
    { q: query, image_type: "photo", safesearch: "true", per_page: "20", min_width: "1000" },
    signal
  );
  return (hits ?? [])
    .filter((hit) => (hit.imageWidth ?? 0) >= 1000 && (hit.imageHeight ?? 0) >= 700)
    .filter((hit) => !!hit.largeImageURL && allowedHost(hit.largeImageURL))
    .filter((hit) => !isOnePerson(hit.tags ?? ""))
    .map((hit) => ({
      url: `/api/photo?pixabay=${hit.id}`,
      credit: hit.user || "Pixabay",
      license: "Pixabay Content License",
      pageUrl: hit.pageURL ?? `https://pixabay.com/photos/${hit.id}/`,
      source: "Pixabay" as const,
    }));
}

// ─── 언스플래쉬 ──────────────────────────────────────────────────────────────

interface UnsplashPhoto {
  alt_description?: string | null;
  description?: string | null;
  width?: number;
  height?: number;
  urls?: { raw?: string; regular?: string };
  links?: { html?: string; download_location?: string };
  user?: { name?: string };
}

async function searchUnsplash(query: string, signal: AbortSignal): Promise<Candidate[]> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return [];
  const headers = { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" };
  const params = new URLSearchParams({ query, per_page: "20", content_filter: "high" });
  const res = await fetch(`${UNSPLASH_API}/search/photos?${params}`, { headers, signal });
  if (!res.ok) return [];
  const results = ((await res.json()) as { results?: UnsplashPhoto[] }).results ?? [];
  return results
    .filter((photo) => (photo.width ?? 0) >= 1000 && (photo.height ?? 0) >= 700)
    .filter((photo) => !!photo.urls?.raw && allowedHost(photo.urls.raw))
    .filter((photo) => !isOnePerson(`${photo.alt_description ?? ""} ${photo.description ?? ""}`))
    .map((photo) => {
      const raw = photo.urls!.raw!;
      // 카드 크기에 맞춰 잘라 받는다(언스플래쉬 주소 변수).
      const sized = `${raw}${raw.includes("?") ? "&" : "?"}w=1080&h=1350&fit=crop&q=80&fm=jpg`;
      return {
        url: `/api/photo?src=${encodeURIComponent(sized)}`,
        credit: photo.user?.name || "Unsplash",
        license: "Unsplash License",
        pageUrl: photo.links?.html ?? "https://unsplash.com",
        source: "Unsplash" as const,
        // 언스플래쉬 API 규정: 사진을 쓰기로 했으면 download_location 을 한 번
        // 불러 알려야 한다. **고른 사진에만** 보낸다(findPhoto).
        ...(photo.links?.download_location
          ? { notify: { url: photo.links.download_location, headers } }
          : {}),
      };
    });
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

async function searchCommons(query: string, signal: AbortSignal): Promise<Candidate[]> {
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
  if (!res.ok) return [];
  const data = (await res.json()) as { query?: { pages?: Record<string, CommonsPage> } };
  const pages = Object.values(data.query?.pages ?? {}).sort((a, b) => (a.index ?? 0) - (b.index ?? 0));

  const found: Candidate[] = [];
  for (const page of pages) {
    const info = page.imageinfo?.[0];
    if (!info?.thumburl || !info.descriptionurl) continue;
    if (!/^image\/(jpeg|png)$/.test(info.mime ?? "")) continue;
    // 카드 한 장(1080×1350)을 덮을 만큼은 커야 한다. 작으면 뭉개진다.
    if ((info.width ?? 0) < 1000 || (info.height ?? 0) < 700) continue;
    if (NOT_A_PHOTO.test(page.title ?? "")) continue;
    if (isOnePerson(page.title ?? "")) continue;

    const meta = info.extmetadata ?? {};
    const license = stripHtml(meta.LicenseShortName?.value ?? "");
    if (!OK_LICENSE.test(license) || BAD_LICENSE.test(license)) continue;
    // 초상권·상표 같은 추가 제한이 표시된 파일은 쓰지 않는다.
    if (stripHtml(meta.Restrictions?.value ?? "")) continue;
    if (!allowedHost(info.thumburl)) continue;

    const artist = stripHtml(meta.Artist?.value ?? "") || "작자 미상";
    found.push({
      url: `/api/photo?src=${encodeURIComponent(info.thumburl)}`,
      credit: artist.slice(0, 60),
      license,
      pageUrl: info.descriptionurl,
      source: "Wikimedia Commons",
    });
  }
  return found;
}

// ─── 차례로 찾기 ─────────────────────────────────────────────────────────────

const PROVIDERS: { name: string; search: typeof searchCommons }[] = [
  { name: "픽사베이", search: searchPixabay },
  { name: "언스플래쉬", search: searchUnsplash },
  { name: "위키미디어", search: searchCommons },
];

/**
 * 무작위로 고를 후보의 수. 검색 결과 앞쪽에서만 고른다.
 *
 * 처음엔 늘 첫 사진을 썼다. 그러자 "부산 MICE"와 "국제회의 유치"에 **똑같은
 * 사진**이 붙었다 — 비슷한 검색어엔 첫 사진도 같다. 그렇다고 아무 데서나
 * 고르면 뒤로 갈수록 검색어와 멀어진다. 앞의 몇 장에서만 고른다.
 */
const POOL = 6;

/**
 * 검색어마다 세 곳을 차례로 보고, 처음 후보가 나온 곳에서 무작위로 하나 고른다.
 * `exclude`(이미 본 사진의 원본 페이지 주소)는 빼고 고른다 — "다른 사진" 버튼.
 * 하나도 못 찾으면 null. 템플릿은 사진 없이 그라데이션으로 그린다.
 */
export async function findPhoto(
  queries: string[],
  timeoutMs = 6_000,
  exclude: string[] = []
): Promise<FoundPhoto | null> {
  const signal = AbortSignal.timeout(timeoutMs);
  const seen = new Set(exclude);
  for (const q of queries.map((s) => s.trim()).filter(Boolean)) {
    for (const provider of PROVIDERS) {
      if (signal.aborted) return null;
      try {
        const pool = (await provider.search(q, signal)).filter((c) => !seen.has(c.pageUrl)).slice(0, POOL);
        if (pool.length === 0) continue;
        const { notify, ...picked } = pool[Math.floor(Math.random() * pool.length)];
        if (notify) await fetch(notify.url, { headers: notify.headers, signal }).catch(() => {});
        return picked;
      } catch (error) {
        console.warn(`[photo] ${provider.name} "${q}" 검색 실패:`, error);
      }
    }
  }
  return null;
}

/** 한 검색어의 후보들. 처음 후보가 나온 곳(픽사베이 → 언스플래쉬 → 위키미디어)의 것. */
async function candidatePool(query: string, signal: AbortSignal): Promise<Candidate[]> {
  for (const provider of PROVIDERS) {
    if (signal.aborted) return [];
    try {
      const found = await provider.search(query, signal);
      if (found.length > 0) return found;
    } catch (error) {
      console.warn(`[photo] ${provider.name} "${query}" 검색 실패:`, error);
    }
  }
  return [];
}

/**
 * 장마다 사진을 하나씩, **서로 겹치지 않게** 고른다.
 *
 * 참고 게시물들은 장마다 사진이 달랐다(표지는 전경, 다음 장은 내부, 그다음은
 * 사람들…). 같은 사진이 이어지면 넘길 이유가 없다. 장마다 검색어를 따로 받아
 * **동시에** 찾고(차례로 찾으면 일곱 장이면 일곱 배 걸린다), 앞 장에서 쓴
 * 사진은 빼고 고른다. 그 장 검색어로 남는 게 없으면 세트 검색어(`fallback`)로.
 */
export async function findSlidePhotos(
  queries: string[],
  fallback: string,
  timeoutMs = 6_000
): Promise<(FoundPhoto | null)[]> {
  const signal = AbortSignal.timeout(timeoutMs);
  const unique = [...new Set([...queries, fallback].map((q) => q.trim()).filter(Boolean))];
  const pools = new Map(
    await Promise.all(unique.map(async (q) => [q, await candidatePool(q, signal)] as const))
  );

  const used = new Set<string>();
  const pick = (q: string) => {
    const pool = (pools.get(q.trim()) ?? []).filter((c) => !used.has(c.pageUrl)).slice(0, POOL);
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
  };

  const chosen = queries.map((q) => {
    const c = pick(q) ?? pick(fallback);
    if (c) used.add(c.pageUrl);
    return c;
  });

  // 언스플래쉬 사용 알림은 실제로 고른 사진에만.
  await Promise.all(
    chosen.map((c) => (c?.notify ? fetch(c.notify.url, { headers: c.notify.headers }).catch(() => {}) : null))
  );
  return chosen.map((c) => {
    if (!c) return null;
    const { notify: _n, ...photo } = c;
    void _n;
    return photo;
  });
}
