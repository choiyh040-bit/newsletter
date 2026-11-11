import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * 사이트 지도. 구글 서치 콘솔·네이버 서치어드바이저에 이 주소(/sitemap.xml)를 등록한다(2026-11-11).
 * 사람마다 내용이 다른 화면(미리보기·생성 중·내 카드뉴스)은 넣지 않는다(`robots.ts` 에서도 막는다).
 */
const PAGES: { path: string; priority: number; changeFrequency: "weekly" | "monthly" | "yearly" }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/guide", priority: 0.8, changeFrequency: "monthly" },
  { path: "/about", priority: 0.7, changeFrequency: "monthly" },
  { path: "/feedback", priority: 0.5, changeFrequency: "weekly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return PAGES.map((p) => ({ url: `${SITE_URL}${p.path === "/" ? "" : p.path}`, lastModified, changeFrequency: p.changeFrequency, priority: p.priority }));
}
