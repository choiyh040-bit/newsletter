/**
 * 사이트 주소 → 언론사 한글 이름.
 *
 * 키워드로 만들면 출처 이름이 검색 근거가 주는 사이트 주소("busan.com")로 나왔다. 게시물에
 * "출처: busan.com"보다 "출처: 부산일보"가 낫다(2026-10-22). 자주 나오는 곳만 적는다. 표에 없으면
 * 원래대로(근거의 제목이나 사이트 주소) 둔다.
 *
 * 하위 주소(news.kbs.co.kr)도 맞춘다. 더 구체적인 주소(biz.chosun.com)를 먼저 본다.
 */
const PRESS: Record<string, string> = {
  // 통신·방송
  "yna.co.kr": "연합뉴스",
  "yonhapnewstv.co.kr": "연합뉴스TV",
  "news1.kr": "뉴스1",
  "newsis.com": "뉴시스",
  "kbs.co.kr": "KBS",
  "imbc.com": "MBC",
  "sbs.co.kr": "SBS",
  "jtbc.co.kr": "JTBC",
  "ytn.co.kr": "YTN",
  "mbn.co.kr": "MBN",
  "ichannela.com": "채널A",
  "tvchosun.com": "TV조선",
  "korea.kr": "대한민국 정책브리핑",
  // 종합지
  "chosun.com": "조선일보",
  "biz.chosun.com": "조선비즈",
  "joongang.co.kr": "중앙일보",
  "donga.com": "동아일보",
  "dongascience.com": "동아사이언스",
  "hani.co.kr": "한겨레",
  "khan.co.kr": "경향신문",
  "hankookilbo.com": "한국일보",
  "kmib.co.kr": "국민일보",
  "seoul.co.kr": "서울신문",
  "segye.com": "세계일보",
  "munhwa.com": "문화일보",
  "naeil.com": "내일신문",
  "nocutnews.co.kr": "노컷뉴스",
  "ohmynews.com": "오마이뉴스",
  "pressian.com": "프레시안",
  "dailian.co.kr": "데일리안",
  "newdaily.co.kr": "뉴데일리",
  "kukinews.com": "쿠키뉴스",
  "sisajournal.com": "시사저널",
  "sisain.co.kr": "시사IN",
  "mediatoday.co.kr": "미디어오늘",
  "koreaherald.com": "코리아헤럴드",
  "koreatimes.co.kr": "코리아타임스",
  // 경제·IT
  "mk.co.kr": "매일경제",
  "hankyung.com": "한국경제",
  "sedaily.com": "서울경제",
  "mt.co.kr": "머니투데이",
  "edaily.co.kr": "이데일리",
  "asiae.co.kr": "아시아경제",
  "fnnews.com": "파이낸셜뉴스",
  "heraldcorp.com": "헤럴드경제",
  "ajunews.com": "아주경제",
  "newspim.com": "뉴스핌",
  "newsway.co.kr": "뉴스웨이",
  "businesspost.co.kr": "비즈니스포스트",
  "thebell.co.kr": "더벨",
  "etnews.com": "전자신문",
  "dt.co.kr": "디지털타임스",
  "ddaily.co.kr": "디지털데일리",
  "zdnet.co.kr": "지디넷코리아",
  "inews24.com": "아이뉴스24",
  "bloter.net": "블로터",
  "boannews.com": "보안뉴스",
  "platum.kr": "플래텀",
  "venturesquare.net": "벤처스퀘어",
  // 지역
  "busan.com": "부산일보",
  "kookje.co.kr": "국제신문",
  "imaeil.com": "매일신문",
  "yeongnam.com": "영남일보",
  "kwnews.co.kr": "강원일보",
  "kado.net": "강원도민일보",
  "joongdo.co.kr": "중도일보",
  "daejonilbo.com": "대전일보",
  "kyeonggi.com": "경기일보",
  "kyeongin.com": "경인일보",
  "incheonilbo.com": "인천일보",
  "jjan.kr": "전북일보",
  "kjdaily.com": "광주매일신문",
  "jnilbo.com": "전남일보",
  "knnews.co.kr": "경남신문",
  "idomin.com": "경남도민일보",
  "jejunews.com": "제주일보",
  "ihalla.com": "한라일보",
  // 분야 전문
  "fashionn.com": "패션엔",
  "fi.co.kr": "패션인사이트",
  "apparelnews.co.kr": "어패럴뉴스",
  "fashionseoul.com": "패션서울",
  "wwdkorea.com": "WWD코리아",
  "fashionbiz.co.kr": "패션비즈",
  "ktnews.com": "한국섬유신문",
  "traveltimes.co.kr": "여행신문",
};

/** 주소(또는 호스트)의 언론사 이름. 표에 없으면 null. */
export function pressName(urlOrHost: string): string | null {
  let host: string;
  try {
    host = (urlOrHost.includes("://") ? new URL(urlOrHost).hostname : urlOrHost).toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
  let best: string | null = null;
  for (const domain of Object.keys(PRESS)) {
    if ((host === domain || host.endsWith("." + domain)) && (!best || domain.length > best.length)) best = domain;
  }
  return best ? PRESS[best] : null;
}
