"use client";

import { Analytics } from "@vercel/analytics/next";

/**
 * 방문 통계(Vercel Web Analytics). 쿠키를 쓰지 않고, 운영자만 Vercel 대시보드의 Analytics 탭에서 본다.
 * 대시보드에서 켜기 전에는 아무것도 모으지 않는다.
 *
 * 주소 뒤 `?` 부분은 잘라서 보낸다. 생성 중 화면(`/loading?keyword=…&url=…`)에는 입력한 키워드와
 * 기사 주소가, 미리보기(`/preview?id=…`)에는 결과 번호가 붙는다. 개인정보처리방침에 "입력한 키워드는
 * 서버에 저장하지 않는다"고 적었으므로 통계에도 남기지 않는다. 페이지별 방문 수는 그대로 셀 수 있다.
 */
export default function SiteAnalytics() {
  return <Analytics beforeSend={(event) => ({ ...event, url: event.url.split(/[?#]/)[0] })} />;
}
