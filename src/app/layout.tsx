import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

import Script from "next/script";
import FloatingHome from "@/components/FloatingHome";
import SiteAnalytics from "@/components/SiteAnalytics";
import { ADSENSE_CLIENT, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

const TITLE = `${SITE_NAME} · 인스타그램 카드뉴스 만들기`;

/**
 * 링크 미리보기(오픈그래프). 전에는 제목이 옛 이름("AI SNS Newsletter Generator")이고 미리보기 정보가
 * 하나도 없어서, 메신저가 주소마다 제멋대로 긁어 갔다. 사용자가 "www 붙이면 미리보기가 보이고
 * 안 붙이면 안 보인다"고 했다(2026-10-16). 그림은 같은 폴더의 opengraph-image.png 가 붙는다.
 * 그림 주소는 대표 주소(SITE_URL) 기준이라 www·옛 주소로 들어와도 같은 그림을 가리킨다.
 * canonical·og:url 은 여기 두지 않는다. 맨 위 설정은 모든 페이지가 물려받아 "모든 페이지가 홈"이 된다.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "ko_KR",
    title: TITLE,
    description: SITE_DESCRIPTION,
  },
  // 애드센스 사이트 소유 확인용. 게시자 번호가 있을 때만 붙는다.
  ...(ADSENSE_CLIENT ? { other: { "google-adsense-account": ADSENSE_CLIENT } } : {}),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 한국어 사이트다. lang 이 "en" 이면 휴대폰 크롬이 한국어로 자동 번역을
  // 걸면서 아이콘 이름(chevron_left 등)까지 "왼쪽 셰브론"으로 바꿔 화면이
  // 깨졌다. 번역기가 카드 글자를 건드리는 것도 막는다(translate="no").
  return (
    <html lang="ko" translate="no" className={`${inter.variable} dark notranslate`}>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body-md selection:bg-primary-container selection:text-white bg-surface text-on-surface">
        {children}
        <FloatingHome />
        <SiteAnalytics />
        {/* 애드센스. 게시자 번호(NEXT_PUBLIC_ADSENSE_CLIENT)가 없으면 싣지 않는다. */}
        {ADSENSE_CLIENT && (
          <Script
            async
            strategy="afterInteractive"
            crossOrigin="anonymous"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          />
        )}
      </body>
    </html>
  );
}
