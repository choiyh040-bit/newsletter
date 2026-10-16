import type { Metadata } from "next";
import InfoPage from "@/components/InfoPage";
import FeedbackBoard from "@/components/FeedbackBoard";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `피드백 게시판 · ${SITE_NAME}`,
  description: "가입 없이 익명으로 오류, 제안, 칭찬을 남길 수 있는 게시판입니다.",
};

export default function FeedbackPage() {
  return (
    <InfoPage
      title="피드백 게시판"
      lead="가입 없이 익명으로 남길 수 있습니다. 오류, 바랐으면 하는 기능, 좋았던 점 무엇이든 적어 주세요. 운영자가 읽고 답을 달기도 합니다."
    >
      <FeedbackBoard />
    </InfoPage>
  );
}
