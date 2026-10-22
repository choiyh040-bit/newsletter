"use client";

import { CARD_HEIGHT, CARD_WIDTH, normalizeCardNews } from "@/lib/cardnews";
import { DEFAULT_ALIGN, resolveColors, templateById } from "@/lib/templates";

/**
 * 홈 소개용 견본 카드. **실제 템플릿 컴포넌트로 그린다.**
 *
 * 전에는 소개 그림(`hero_mockup.png`)을 썼는데, SNS 전체 게시물을 만들던 시절 그림이라
 * 오른쪽 절반이 트위터 게시물이었다(2026-10-16 사용자 지적). 그림 파일은 템플릿을 고쳐도
 * 낡은 채로 남으므로, 템플릿 고르기 견본처럼 실제 컴포넌트로 그린다.
 *
 * 첫 화면의 세 장 부채꼴(HeroCards)은 꾸밈이라 뺐다(2026-10-16 사용자). 템플릿 고르기에 같은 견본이
 * 이미 있다. 링크 미리보기 그림(app/opengraph-image.png)은 그 부채꼴을 찍어 둔 고정 파일이다.
 */
const SAMPLE = normalizeCardNews({
  title: "견본",
  accent: "#1a3a5c",
  slides: [
    {
      kind: "cover",
      badge: "트렌드 소식",
      sub: "요즘 뜨는 팝업",
      heading: ["성수동 팝업", "==방문객 2배==", "늘었다"],
      body: [],
    },
  ],
  caption: "",
  hashtags: [],
  source: { name: "견본", url: "" },
});

const SAMPLE_PHOTO = { url: "/sample-photo.svg", credit: "견본", source: "upload" as const };

function Card({ templateId, width }: { templateId: string; width: number }) {
  const template = templateById(templateId);
  const Render = template.Render;
  const scale = width / CARD_WIDTH;
  return (
    <div className="relative overflow-hidden pointer-events-none" style={{ width, height: CARD_HEIGHT * scale }} aria-hidden>
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          // 홈은 낱말이 안 갈리게 줄바꿈 규칙을 바꿔 두었다(.ko-text). 카드는 기본값으로.
          wordBreak: "normal",
          overflowWrap: "normal",
        }}
      >
        <Render
          slide={SAMPLE.slides[0]}
          accent={SAMPLE.accent}
          total={5}
          source={SAMPLE.source}
          photo={template.background === "photo" ? SAMPLE_PHOTO : null}
          variant={resolveColors(template, null, null)}
          align={DEFAULT_ALIGN}
        />
      </div>
    </div>
  );
}

/** 기능 소개 상자 안의 한 장. */
export function FeatureCard({ height }: { height: number }) {
  return <Card templateId="photo-frame" width={Math.round((height * CARD_WIDTH) / CARD_HEIGHT)} />;
}
