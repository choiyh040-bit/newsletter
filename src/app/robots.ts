import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * 검색 로봇 안내. 사람마다 내용이 다른 화면과 API 는 검색에 올리지 않는다(2026-11-11).
 * 미리보기·내 카드뉴스는 브라우저에만 저장된 결과를 보여 주므로 로봇에게는 빈 화면이다.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/preview", "/loading", "/my"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
