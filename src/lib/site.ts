/**
 * 사이트 운영 정보. 값은 환경변수에서 읽는다(Vercel 대시보드 → Settings →
 * Environment Variables). 저장소에 개인 연락처나 광고 계정 번호를 박아 두지 않기 위해서다.
 *
 * `NEXT_PUBLIC_` 이 붙은 값은 빌드할 때 페이지에 들어간다. 바꾼 뒤에는 다시 배포해야 한다.
 */

/**
 * 문의 이메일. 환경변수가 있으면 그것, 없으면 운영자 주소(2026-10-16 사용자가 정함).
 * 개인정보처리방침·이용약관의 문의처로 공개된다.
 */
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "choiyh040@gmail.com";

/** 서비스 이름. 화면 머리의 이름과 같다. */
export const SITE_NAME = "CardGen AI";

/**
 * 대표 주소. 링크 미리보기(카톡·페이스북 등)의 주소·그림 주소를 이 주소로 적는다.
 * www 를 붙인 주소는 Vercel 에서 이 주소로 넘어간다(2026-10-16 가비아 도메인).
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://cardnewsmaker.com").replace(/\/$/, "");

/** 한 줄 소개. 검색 결과와 링크 미리보기에 나온다. */
export const SITE_DESCRIPTION =
  "키워드나 기사 주소 하나로 인스타그램 카드뉴스(1080×1350) 5~7장과 캡션을 만듭니다. 가입 없이 무료.";

/** 안내 문서의 시행일. 내용을 바꾸면 함께 고친다. */
export const POLICY_DATE = "2026년 10월 16일";

/**
 * 구글 애드센스 게시자 번호(예: `ca-pub-1234567890123456`). **비어 있으면 광고를
 * 전혀 싣지 않는다** — 광고 스크립트, 광고 칸, ads.txt, 개인정보처리방침의 광고
 * 항목이 모두 꺼진다. 애드센스 승인을 받은 뒤 Vercel 환경변수에 넣으면 켜진다.
 */
export const ADSENSE_CLIENT = /^ca-pub-\d{10,20}$/.test(process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() ?? "")
  ? process.env.NEXT_PUBLIC_ADSENSE_CLIENT!.trim()
  : "";
