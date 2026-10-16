"use client";

import { useEffect, useRef, useState } from "react";
import { CARD_HEIGHT, CARD_WIDTH, normalizeCardNews } from "@/lib/cardnews";
import { DEFAULT_ALIGN, resolveColors, templateById } from "@/lib/templates";

/**
 * 홈 소개용 견본 카드. **실제 템플릿 컴포넌트로 그린다.**
 *
 * 전에는 소개 그림(`hero_mockup.png`)을 썼는데, SNS 전체 게시물을 만들던 시절 그림이라
 * 오른쪽 절반이 트위터 게시물이었다(2026-10-16 사용자 지적). 그림 파일은 템플릿을 고쳐도
 * 낡은 채로 남으므로, 템플릿 고르기 견본처럼 실제 컴포넌트로 그린다.
 */
const SAMPLE = normalizeCardNews({
  title: "견본",
  accent: "#1a3a5c",
  slides: [
    {
      kind: "cover",
      badge: "MICE 뉴스",
      sub: "국제회의 유치",
      heading: ["국제회의에", "==210억 원==", "투입한다"],
      body: [],
    },
    {
      kind: "detail",
      badge: "MICE 뉴스",
      sub: "지원 대상",
      heading: ["올해 유치할", "==국제회의 40건=="],
      body: ["참가자 500명 이상", "외국인 비율 30% 넘는 행사"],
    },
    {
      kind: "detail",
      badge: "MICE 뉴스",
      sub: "신청 방법",
      heading: ["다음 달부터", "온라인 신청"],
      body: ["누리집에서 서류를 내면", "두 주 안에 결과를 알린다"],
    },
  ],
  caption: "",
  hashtags: [],
  source: { name: "견본", url: "" },
});

const SAMPLE_PHOTO = { url: "/sample-photo.svg", credit: "견본", source: "upload" as const };

function Card({ templateId, slideIndex, width }: { templateId: string; slideIndex: number; width: number }) {
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
          slide={SAMPLE.slides[slideIndex]}
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

/** 상자 폭을 재서 카드 크기를 맞춘다. 카드는 고정 크기(1080)를 줄여 그리므로 px 값이 필요하다. */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/** 첫 화면: 세 장을 부채꼴로. 가운데가 표지. */
export function HeroCards() {
  const [ref, width] = useWidth<HTMLDivElement>();
  const card = Math.min(260, Math.round(width * (width < 500 ? 0.44 : 0.36)));
  const cards = [
    { templateId: "cream-bold", slide: 1, x: -0.74, r: -7 },
    { templateId: "dark-neon", slide: 2, x: 0.74, r: 7 },
    { templateId: "photo-caption", slide: 0, x: 0, r: 0 },
  ];
  return (
    <div
      ref={ref}
      data-hero-cards
      className="relative w-full flex items-center justify-center"
      style={{ height: card ? (card * CARD_HEIGHT) / CARD_WIDTH + 40 : 0 }}
    >
      {card > 0 &&
        cards.map((c) => (
          <div
            key={c.templateId}
            className="absolute shadow-2xl"
            style={{
              transform: `translateX(${c.x * card}px) rotate(${c.r}deg)${c.x === 0 ? " translateY(-6px)" : " scale(0.9)"}`,
              boxShadow: "0 30px 60px rgba(0,0,0,0.5)",
            }}
          >
            <Card templateId={c.templateId} slideIndex={c.slide} width={card} />
          </div>
        ))}
    </div>
  );
}

/** 기능 소개 상자 안의 한 장. */
export function FeatureCard({ height }: { height: number }) {
  return <Card templateId="photo-frame" slideIndex={0} width={Math.round((height * CARD_WIDTH) / CARD_HEIGHT)} />;
}
