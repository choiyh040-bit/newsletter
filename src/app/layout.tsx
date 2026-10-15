import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

import FloatingHome from "@/components/FloatingHome";

export const metadata: Metadata = {
  title: "AI SNS Newsletter Generator",
  description: "AI SNS Newsletter Generator created from Stitch",
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
      </body>
    </html>
  );
}
