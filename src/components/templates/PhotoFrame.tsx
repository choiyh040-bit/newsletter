import { CARD_HEIGHT, CARD_WIDTH, photoCredit } from "@/lib/cardnews";
import { gradientFor, legibleOn, withAlpha } from "@/lib/templates/color";
import { fitFontSize } from "@/lib/templates/fit";
import { LIGHT_VARIANTS } from "@/lib/templates/variants";
import { FONT_STACK, type TemplatePhoto, type TemplateProps } from "@/lib/templates/types";
import TextLines from "./TextLines";

/**
 * 흰 바탕 · 사진 상자. 사용자가 보낸 제작 가이드(참고 자료 "추가 1번")를 옮겼다
 * (2026-10-16). 사진을 바탕에 깔지 않고 **흰 바탕 위에 둥근 네모로 얹는다.**
 *
 * - 표지: 좌측 정렬로 부제목(보통) → 타이틀(두껍게). 오른쪽 아래에 세로로 긴
 *   사진, 그 왼쪽 아래 구석에 출처(두껍게)와 한 줄 설명(얇게).
 * - 본문: 오른쪽 위에 작은 출처, 그 아래 **글보다 큰 사진**, 사진 밑에 좌측
 *   정렬 제목(두껍게)과 본문(얇게).
 *
 * 가이드의 글자 크기(부제 45·타이틀 60·본문 28)는 비율만 따랐다. 실제 크기는
 * 다른 템플릿처럼 칸에 맞춰 계산한다(`fitFontSize`).
 */
export default function PhotoFrame({ slide, accent, total, source, photo, variant }: TemplateProps) {
  const { base, neon } = variant ?? LIGHT_VARIANTS[0];
  const isCover = slide.kind === "cover";
  const index = slide.slideNumber - 1;
  const ink = "#16181D";
  const sub = "#5B6070";
  const hl = legibleOn(neon, base);
  const mark = { accentColor: hl, markBackground: withAlpha(neon, 0.22), markColor: ink };
  const pad = 88;
  const width = CARD_WIDTH - pad * 2;

  const counter = (
    <div
      style={{
        position: "absolute",
        top: 48,
        right: 48,
        borderRadius: 999,
        background: "#4A4D55",
        color: "#ffffff",
        fontSize: 30,
        fontWeight: 600,
        padding: "12px 28px",
        lineHeight: 1.2,
      }}
    >
      {slide.slideNumber}/{total}
    </div>
  );

  if (isCover) {
    const headingSize = fitFontSize({
      lines: slide.heading,
      width,
      height: 370,
      max: 120,
      min: 72,
      lineHeight: 1.22,
    });
    return (
      <Frame base={base}>
        {counter}
        <div style={{ position: "absolute", left: pad, right: pad, top: 200 }}>
          {slide.sub && (
            <div style={{ fontSize: 50, fontWeight: 400, color: ink, marginBottom: 18, letterSpacing: "-0.02em" }}>
              {slide.sub}
            </div>
          )}
          <div style={{ fontSize: headingSize, fontWeight: 800, lineHeight: 1.22, letterSpacing: "-0.04em", color: ink }}>
            <TextLines lines={slide.heading} {...mark} />
          </div>
        </div>
        <Photo
          photo={photo}
          fallback={gradientFor(accent, index, total)}
          style={{ position: "absolute", right: 64, bottom: 120, width: 450, height: 500 }}
        />
        <div style={{ position: "absolute", left: pad, bottom: 128, width: 400 }}>
          {source && (
            <div style={{ fontSize: 30, fontWeight: 700, color: ink, marginBottom: 10 }}>출처 · {source.name}</div>
          )}
          <div style={{ fontSize: 28, fontWeight: 400, color: sub, lineHeight: 1.5 }}>
            {slide.badge}
          </div>
        </div>
        <Credit photo={photo} style={{ right: 64, bottom: 76 }} />
      </Frame>
    );
  }

  const headingSize = fitFontSize({
    lines: slide.heading,
    width,
    height: 200,
    max: 76,
    min: 50,
    lineHeight: 1.28,
  });
  const bodySize = fitFontSize({
    lines: slide.body,
    width,
    height: 260,
    max: 40,
    min: 30,
    lineHeight: 1.55,
  });

  return (
    <Frame base={base}>
      {counter}
      {source && (
        <div style={{ position: "absolute", left: pad, top: 62, fontSize: 26, color: sub, fontWeight: 400 }}>
          출처 · {source.name}
        </div>
      )}
      <Photo
        photo={photo}
        fallback={gradientFor(accent, index, total)}
        style={{ position: "absolute", left: 64, right: 64, top: 140, height: 560 }}
      />
      <Credit photo={photo} style={{ right: 72, top: 712 }} />
      <div style={{ position: "absolute", left: pad, right: pad, top: 770 }}>
        {slide.sub && (
          <div style={{ fontSize: 30, fontWeight: 700, color: hl, marginBottom: 14 }}>{slide.sub}</div>
        )}
        <div style={{ fontSize: headingSize, fontWeight: 800, lineHeight: 1.28, letterSpacing: "-0.035em", color: ink }}>
          <TextLines lines={slide.heading} {...mark} />
        </div>
        {slide.body.length > 0 && (
          <div
            style={{
              marginTop: 26,
              fontSize: bodySize,
              fontWeight: 400,
              lineHeight: 1.55,
              color: "#30333B",
              letterSpacing: "-0.015em",
            }}
          >
            <TextLines lines={slide.body} {...mark} />
          </div>
        )}
      </div>
    </Frame>
  );
}

function Frame({ base, children }: { base: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        position: "relative",
        overflow: "hidden",
        background: base,
        fontFamily: FONT_STACK.sans,
        textAlign: "left",
      }}
    >
      {children}
    </div>
  );
}

/** 둥근 네모 사진. 사진을 못 찾았으면 기사 색 그라데이션으로 채운다. */
function Photo({
  photo,
  fallback,
  style,
}: {
  photo: TemplatePhoto | null;
  fallback: string;
  style: React.CSSProperties;
}) {
  return (
    <div style={{ ...style, borderRadius: 36, overflow: "hidden", background: fallback }}>
      {photo && (
        // eslint-disable-next-line @next/next/no-img-element -- PNG 로 구울 때 그대로 담기려면 평범한 img 여야 한다
        <img src={photo.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      )}
    </div>
  );
}

/** 사진 표기(라이선스상 빼면 안 되는 사진이 있다). 사진 바로 아래 오른쪽에 작게. */
function Credit({ photo, style }: { photo: TemplatePhoto | null; style: React.CSSProperties }) {
  const credit = photo ? photoCredit(photo) : "";
  if (!credit) return null;
  return (
    <div style={{ position: "absolute", ...style, fontSize: 18, color: "#8A8F9C", whiteSpace: "nowrap" }}>
      사진 · {credit}
    </div>
  );
}
