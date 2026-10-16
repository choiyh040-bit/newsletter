import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

import Script from "next/script";
import FloatingHome from "@/components/FloatingHome";
import { ADSENSE_CLIENT } from "@/lib/site";

export const metadata: Metadata = {
  title: "AI SNS Newsletter Generator",
  description: "AI SNS Newsletter Generator created from Stitch",
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
