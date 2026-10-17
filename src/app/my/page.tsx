import type { Metadata } from "next";
import InfoPage from "@/components/InfoPage";
import MyCards from "@/components/MyCards";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `내 카드뉴스 · ${SITE_NAME}`,
  description: "이 브라우저에서 만든 카드뉴스를 다시 열어 봅니다.",
  // 사람마다 내용이 다른(브라우저에만 있는) 페이지라 검색에 올리지 않는다.
  robots: { index: false },
};

export default function MyPage() {
  return (
    <InfoPage title="내 카드뉴스" lead="이 브라우저에서 만든 카드뉴스입니다. 누르면 미리보기로 열려 디자인을 바꾸거나 다시 내려받을 수 있습니다.">
      <MyCards />
    </InfoPage>
  );
}
