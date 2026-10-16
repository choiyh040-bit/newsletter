import { CARD_HEIGHT, CARD_WIDTH } from "@/lib/cardnews";
import { shade, withAlpha } from "@/lib/templates/color";
import { fitFontSize } from "@/lib/templates/fit";
import { HAND_VARIANTS } from "@/lib/templates/variants";
import { FONT_STACK, type TemplateProps } from "@/lib/templates/types";
import TextLines from "./TextLines";

/**
 * 손글씨 메모. 사용자가 보낸 참고 자료("추가 2번", 손글씨·아이패드 필기 스타일)를
 * 옮겼다(2026-10-16).
 *
 * 읽어 낸 규칙:
 * - 종이색 바탕(노란 메모지·크림), **손글씨 서체**, 위에 붙인 마스킹테이프.
 * - 제목 핵심어에 **형광펜**(글자 아래쪽 절반만 칠한 굵은 띠), 제목 아래 손으로
 *   그은 두 줄 밑줄. 빨간 펜으로 강조어.
 * - 왼쪽 위 분류는 손으로 그린 타원 안에, 소제목은 별 두 개 사이 타원 안에.
 * - 별·반짝임 낙서 몇 개.
 *
 * 형광펜 색이 `variant.neon` 이다(사람이 고른다). 강조어(`*…*`)는 빨간 펜으로
 * 고정했다. 형광펜과 같은 색으로 쓰면 종이 위에서 안 읽힌다.
 *
 * 참고 게시물의 그림(웃는 얼굴, 찢은 종잇조각, 아이패드 틀)은 넣지 않았다.
 * 매번 같은 그림이 붙으면 금세 질린다. 낙서는 선 몇 개로만.
 */
const INK = "#1D1B19";
const PEN = "#D9412F";

export default function HandNote({ slide, total, source, variant }: TemplateProps) {
  const { base, neon } = variant ?? HAND_VARIANTS[0];
  const isCover = slide.kind === "cover";
  const width = CARD_WIDTH - 110 * 2;
  // 개구는 한글 한 자가 0.82em 인데 획이 그 안에 작게 들어 있어 글자 사이가 넓다. 자간을 -0.1em 좁힌다.
  // 그래서 한 자 0.72em 쯤. 넉넉하게 0.78 로 잡는다.
  const charWidth = 0.78;
  const marker = withAlpha(neon, 0.9);
  const mark = {
    accentColor: PEN,
    markBackground: `linear-gradient(180deg, transparent 42%, ${marker} 42%, ${marker} 92%, transparent 92%)`,
    markColor: INK,
  };

  const headingSize = fitFontSize({
    lines: slide.heading,
    width,
    height: isCover ? 460 : 300,
    max: isCover ? 150 : 104,
    min: isCover ? 84 : 64,
    lineHeight: 1.18,
    charWidth,
  });
  const bodySize = fitFontSize({
    lines: slide.body,
    width,
    height: isCover ? 160 : 400,
    max: 54,
    min: 40,
    lineHeight: 1.45,
    charWidth,
  });

  return (
    <div
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        position: "relative",
        overflow: "hidden",
        background: base,
        fontFamily: FONT_STACK.hand,
        fontWeight: 700,
        letterSpacing: "-0.1em",
        color: INK,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "190px 110px 150px",
        boxSizing: "border-box",
        textAlign: "center",
      }}
    >
      {/* 마스킹테이프 */}
      <div
        style={{
          position: "absolute",
          top: -18,
          left: CARD_WIDTH / 2 - 130,
          width: 260,
          height: 92,
          background: "rgba(232, 222, 196, 0.82)",
          transform: "rotate(-2.5deg)",
          boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
        }}
      />

      {/* 왼쪽 위: 분류를 손으로 그린 타원 안에 */}
      {slide.badge && (
        <div
          style={{
            position: "absolute",
            top: 92,
            left: 70,
            fontSize: 40,
            lineHeight: 1.1,
            padding: "14px 36px",
            border: `4px solid ${INK}`,
            borderRadius: "50%",
            transform: "rotate(-5deg)",
            background: withAlpha(neon, 0.35),
            whiteSpace: "nowrap",
          }}
        >
          {slide.badge}
        </div>
      )}

      <div
        style={{
          position: "absolute",
          top: 48,
          right: 48,
          borderRadius: 999,
          background: "#5A5650",
          color: "#ffffff",
          fontFamily: FONT_STACK.sans,
          fontWeight: 600,
          fontSize: 30,
          padding: "12px 28px",
          lineHeight: 1.2,
        }}
      >
        {slide.slideNumber}/{total}
      </div>

      <Sparkle style={{ position: "absolute", top: 250, right: 92 }} color={INK} />
      <Star style={{ position: "absolute", bottom: 210, left: 74 }} color={shade(neon, -0.25)} size={58} />

      {/* 제목 */}
      {/* 개구 굵은체도 붓펜보다는 가늘어서 제목만 같은 색 테두리로 획을 두껍게 한다. */}
      <div style={{ fontSize: headingSize, lineHeight: 1.18, WebkitTextStroke: `2px ${INK}` }}>
        <TextLines lines={slide.heading} {...mark} />
      </div>
      <Underline width={Math.min(width, 720)} color={INK} />

      {/* 소제목: 별 두 개 사이 타원 */}
      {slide.sub && (
        <div style={{ display: "flex", alignItems: "center", gap: 22, marginTop: 40 }}>
          <Star color={shade(neon, -0.25)} size={44} />
          <div
            style={{
              fontSize: 46,
              lineHeight: 1.1,
              padding: "14px 44px",
              border: `3px solid ${INK}`,
              borderRadius: "50%",
              whiteSpace: "nowrap",
            }}
          >
            {slide.sub}
          </div>
          <Star color={shade(neon, -0.25)} size={44} />
        </div>
      )}

      {slide.body.length > 0 && (
        <div style={{ marginTop: 50, fontSize: bodySize, lineHeight: 1.45, color: "#2E2B27" }}>
          <TextLines lines={slide.body} {...mark} />
        </div>
      )}

      {isCover && (
        <div style={{ marginTop: 64, fontSize: 44, color: "#4A453E", transform: "rotate(-2deg)" }}>
          옆으로 넘겨보세요 →
        </div>
      )}

      {source && (
        <div style={{ position: "absolute", bottom: 46, right: 64, fontSize: 30, color: "#6B655C" }}>
          출처 · {source.name}
        </div>
      )}
    </div>
  );
}

/** 손으로 두 번 그은 밑줄. 두 선이 조금씩 어긋나야 손으로 그은 것 같다. */
function Underline({ width, color }: { width: number; color: string }) {
  return (
    <svg width={width} height={34} viewBox="0 0 400 34" preserveAspectRatio="none" style={{ marginTop: 6 }}>
      <path d="M4 12 C 90 6, 200 9, 396 7" stroke={color} strokeWidth={4} fill="none" strokeLinecap="round" />
      <path d="M16 26 C 120 20, 260 24, 380 19" stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" />
    </svg>
  );
}

function Star({ color, size, style }: { color: string; size: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 50 50" style={style}>
      <path
        d="M25 4 L31 18 L46 19 L34 29 L38 45 L25 36 L12 45 L16 29 L4 19 L19 18 Z"
        stroke={color}
        strokeWidth={3.5}
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function Sparkle({ color, style }: { color: string; style?: React.CSSProperties }) {
  return (
    <svg width={64} height={64} viewBox="0 0 64 64" style={style}>
      <path
        d="M32 6 C 34 24, 40 30, 58 32 C 40 34, 34 40, 32 58 C 30 40, 24 34, 6 32 C 24 30, 30 24, 32 6 Z"
        stroke={color}
        strokeWidth={3.5}
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
