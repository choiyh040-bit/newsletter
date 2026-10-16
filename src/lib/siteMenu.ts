/**
 * 사이트 메뉴 항목. 휴대폰 ☰(`MobileMenu`)와 안내 페이지 머리의 가로 메뉴가 함께 쓴다.
 *
 * "use client" 파일(`MobileMenu.tsx`)에 두면 서버 컴포넌트(`InfoPage`)에서 가져올 때
 * 배열이 아니라 클라이언트 참조가 와서 `.slice` 가 없다는 오류로 페이지가 500 이 났다.
 * 그래서 평범한 파일로 뺐다.
 */
export interface MenuItem {
  href: string;
  label: string;
}

export const SITE_MENU: MenuItem[] = [
  { href: "/", label: "홈 · 카드뉴스 만들기" },
  { href: "/guide", label: "사용법 · 자주 묻는 질문" },
  { href: "/feedback", label: "피드백 게시판" },
  { href: "/about", label: "서비스 소개" },
];
