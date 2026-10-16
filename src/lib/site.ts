/**
 * 사이트 운영 정보. 값은 환경변수에서 읽는다(Vercel 대시보드 → Settings →
 * Environment Variables). 저장소에 개인 연락처나 광고 계정 번호를 박아 두지 않기 위해서다.
 *
 * `NEXT_PUBLIC_` 이 붙은 값은 빌드할 때 페이지에 들어간다. 바꾼 뒤에는 다시 배포해야 한다.
 */

/** 문의 이메일. 비어 있으면 안내 페이지에 "문의처 준비 중"으로 나온다. */
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() ?? "";

/** 서비스 이름. 화면 머리의 이름과 같다. */
export const SITE_NAME = "CardGen AI";

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
