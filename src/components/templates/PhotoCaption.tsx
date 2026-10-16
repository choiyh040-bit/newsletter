import { CARD_HEIGHT, CARD_WIDTH, photoCredit } from "@/lib/cardnews";
import { gradientFor, readableOn } from "@/lib/templates/color";
import { fitFontSize } from "@/lib/templates/fit";
import { CAPTION_VARIANTS } from "@/lib/templates/variants";
import { FONT_STACK, type TemplateProps } from "@/lib/templates/types";
import TextLines from "./TextLines";

/**
 * 사진 · 자막. 사용자가 보낸 참고 자료("추가 3번", 패션 릴스 정리)를 옮겼다
 * (2026-10-16). 장마다 다른 사진을 꽉 채우고 **상자 없이 자막처럼** 글씨만 얹는다.
 * 그 게시물의 말 그대로 "최고의 감도는 심플이다".
 *
 * - 글씨는 가운데 정렬, 사진의 아래쪽 1/3 에. 큰 제목 두세 줄 + 작은 흰 한 줄.
 * - 색은 하나만. 제목은 흰색, 강조어(`*…*`, `==…==`)만 고른 색(`variant.neon`).
 *
 * 참고 게시물은 사람이 사진을 골라서 상자 없이도 읽혔다. 여기는 사진을 자동으로
 * 찾으므로 밝은 사진에서도 읽히게 **아래쪽만 옅게 어둡게** 하고, 글자에 얇은
 * 그림자를 둘렀다. 상자는 넣지 않는다(그게 이 디자인의 정체성이다).
 */
export default function PhotoCaption({ slide, accent, total, source, photo, variant }: TemplateProps) {
  const { neon } = variant ?? CAPTION_VARIANTS[0];
  const isCover = slide.kind === "cover";
  const index = slide.slideNumber - 1;
  const credit = photo ? photoCredit(photo) : "";
  const width = CARD_WIDTH - 96 * 2;
  // 아래 어둡게 깔기는 흰 회의실·흰 키보드 같은 아주 밝은 사진에서 본문이 흐려
  // 보여 2026-10-16 배포 확인 뒤 한 번 더 진하게 했다.
  // 글자 테두리 대신 겹친 그림자. 밝은 사진에서도 윤곽이 남고, PNG 로 구워도 같다.
  const shadow = "0 0 2px rgba(0,0,0,0.55), 0 2px 10px rgba(0,0,0,0.45), 0 0 28px rgba(0,0,0,0.25)";

  const headingSize = fitFontSize({
    lines: slide.heading,
    width,
    height: isCover ? 400 : 300,
    max: isCover ? 124 : 92,
    min: isCover ? 72 : 56,
    lineHeight: 1.2,
  });
  const bodySize = fitFontSize({
    lines: slide.body,
    width,
    height: 260,
    max: 38,
    min: 30,
    lineHeight: 1.5,
  });
  // 표지의 작은 줄은 소제목. 상세 장은 본문이 작은 줄 역할을 한다.
  const small = isCover ? (slide.sub ? [[{ text: slide.sub, style: "plain" as const }]] : []) : slide.body;

  return (
    <div
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        position: "relative",
        overflow: "hidden",
        background: gradientFor(accent, index, total),
        fontFamily: FONT_STACK.sans,
        color: "#ffffff",
        textAlign: "center",
      }}
    >
      {photo && (
        // eslint-disable-next-line @next/next/no-img-element -- PNG 로 구울 때 그대로 담기려면 평범한 img 여야 한다
        <img
          src={photo.url}
          alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      )}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0) 20%, rgba(0,0,0,0.05) 36%, rgba(0,0,0,0.5) 58%, rgba(0,0,0,0.68) 80%, rgba(0,0,0,0.72) 100%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 48,
          right: 48,
          borderRadius: 999,
          background: "rgba(0,0,0,0.62)",
          fontSize: 30,
          fontWeight: 600,
          padding: "12px 28px",
          lineHeight: 1.2,
        }}
      >
        {slide.slideNumber}/{total}
      </div>

      {/* 자막 덩어리: 아래에서부터 쌓는다. 줄 수가 달라도 바닥 여백이 같다. */}
      <div
        style={{
          position: "absolute",
          left: 96,
          right: 96,
          bottom: 130,
          textShadow: shadow,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {!isCover && slide.sub && (
          <div style={{ fontSize: 34, fontWeight: 700, color: neon, marginBottom: 18, letterSpacing: "0.02em" }}>
            {slide.sub}
          </div>
        )}
        <div style={{ fontSize: headingSize, fontWeight: 800, lineHeight: 1.2, letterSpacing: "-0.035em" }}>
          <TextLines lines={slide.heading} accentColor={neon} markBackground={neon} markColor={readableOn(neon)} />
        </div>
        {small.length > 0 && (
          <div
            style={{
              marginTop: 26,
              fontSize: isCover ? 40 : bodySize,
              fontWeight: 500,
              lineHeight: 1.5,
              color: "rgba(255,255,255,0.94)",
              letterSpacing: "-0.015em",
            }}
          >
            <TextLines lines={small} accentColor={neon} markBackground={neon} markColor={readableOn(neon)} />
          </div>
        )}
      </div>

      <div
        style={{
          position: "absolute",
          left: 48,
          right: 48,
          bottom: 30,
          display: "flex",
          justifyContent: "space-between",
          gap: 24,
          fontSize: 19,
          color: "rgba(255,255,255,0.7)",
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{credit && `사진 · ${credit}`}</span>
        {source && <span>출처 · {source.name}</span>}
      </div>
    </div>
  );
}
