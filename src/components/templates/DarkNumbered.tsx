import { CARD_HEIGHT, CARD_WIDTH, photoCredit } from "@/lib/cardnews";
import { withAlpha } from "@/lib/templates/color";
import { fitFontSize } from "@/lib/templates/fit";
import { NUMBERED_VARIANTS } from "@/lib/templates/variants";
import { FONT_STACK, type TemplateProps } from "@/lib/templates/types";
import TextLines from "./TextLines";

/**
 * 검정 · 번호 정리. 사용자가 보낸 참고 게시물(2026-10-30, "웹사이트를 완성하는 8가지 프롬프트")을 옮겼다.
 *
 * 읽어 낸 규칙:
 * - 표지: 위는 사진, 아래로 검정에 스며든다. 그 위에 **아주 굵은** 흰 제목을 가운데 크게, 강조어만 한 색.
 *   맨 아래 "옆으로 넘겨보세요".
 * - 상세: 검정 바탕. 위쪽에 자간 넓힌 작은 분류와 "03 / 10". **큰 번호 "01." + 색 점**, 굵은 제목, 회색 부제.
 *   그 아래 둥근 회색 글 상자에 작은 라벨과 본문. 본문 속 핵심어는 **회색 칩**.
 *
 * 우리 데이터로: 분류 = badge, 번호 = 상세 장 순서, 제목 = heading, 부제 = sub, 상자 = body.
 * 형광펜(`==…==`)은 회색 칩, 색 강조(`*…*`)는 한 색 글자. 표지에서는 둘 다 한 색 글자다(원본 표지처럼).
 * 원본 표지의 인물 사진은 자동 사진 원칙(사람 없음) 때문에 사진 검색 결과로 대신한다.
 * 단색 바탕이라 글로우는 쓰지 않는다(2026-10-16 사용자 규칙).
 */
const SIDE = 96;
const INK = "#F2F2F2";
const MUTED = "#9B9B9F";
const LABEL = "#C9C9CD";

export default function DarkNumbered({ slide, total, source, photo, variant }: TemplateProps) {
  const { base, neon } = variant ?? NUMBERED_VARIANTS[0];
  const isCover = slide.kind === "cover";
  const isOutro = slide.kind === "outro";
  const credit = photo ? photoCredit(photo) : "";
  const width = CARD_WIDTH - SIDE * 2;

  const shell: React.CSSProperties = {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    position: "relative",
    overflow: "hidden",
    background: base,
    color: INK,
    fontFamily: FONT_STACK.sans,
    wordBreak: "keep-all",
  };

  if (isCover) {
    // 원티드산스 ExtraBold 에 자간 -0.045em 이라 한 자가 0.93em 쯤.
    const size = fitFontSize({ lines: slide.heading, width: CARD_WIDTH - 140, height: 560, max: 150, min: 84, lineHeight: 1.14, charWidth: 0.95 });
    return (
      <div style={shell}>
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element -- PNG 로 구울 때 그대로 담기려면 평범한 img 여야 한다
          <img
            src={photo.url}
            alt=""
            style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "72%", objectFit: "cover" }}
          />
        )}
        {/* 사진 아래쪽을 바탕색으로 스며들게. 글은 이 단색 위에 얹힌다. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(180deg, ${withAlpha(base, 0.05)} 0%, ${withAlpha(base, 0.15)} 30%, ${withAlpha(base, 0.85)} 56%, ${base} 68%)`,
          }}
        />
        <PageNumber n={slide.slideNumber} total={total} pill />
        <div
          style={{
            position: "absolute",
            left: 70,
            right: 70,
            bottom: 210,
            textAlign: "center",
          }}
        >
          {slide.sub && (
            <div style={{ fontSize: 34, fontWeight: 700, color: LABEL, letterSpacing: "0.04em", marginBottom: 26 }}>{slide.sub}</div>
          )}
          {/* 처음엔 검은고딕이었는데 사용자가 "안 예쁘다"(2026-10-30). 원본처럼 획이 깔끔한 아주 굵은 고딕으로. */}
          {/* 원티드산스는 800 이 가장 굵다. 원본은 그보다 묵직해서 같은 색 테두리로 한 단계 더 굵게(손글씨 제목과 같은 방법). */}
          <div style={{ fontWeight: 800, fontSize: size, lineHeight: 1.14, letterSpacing: "-0.04em", WebkitTextStrokeWidth: Math.max(2, Math.round(size / 42)) }}>
            <TextLines lines={slide.heading} accentColor={neon} />
          </div>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 104, textAlign: "center", fontSize: 36, fontWeight: 700 }}>
          옆으로 넘겨보세요
        </div>
        <Footer credit={credit} source={source?.name} />
      </div>
    );
  }

  const number = String(slide.slideNumber - 1).padStart(2, "0");
  const titleSize = fitFontSize({ lines: slide.heading, width, height: isOutro ? 300 : 200, max: isOutro ? 88 : 72, min: 48, lineHeight: 1.2, charWidth: 1.0 });
  const bodySize = fitFontSize({ lines: slide.body, width: width - 112, height: 520, max: 42, min: 30, lineHeight: 1.65, charWidth: 0.98 });

  return (
    <div style={shell}>
      {/* 위쪽: 분류와 쪽 번호 */}
      <div
        style={{
          position: "absolute",
          top: 112,
          left: SIDE,
          right: SIDE,
          display: "flex",
          justifyContent: "space-between",
          fontSize: 26,
          fontWeight: 600,
          letterSpacing: "0.18em",
          color: LABEL,
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{slide.badge}</span>
        <PageNumber n={slide.slideNumber} total={total} />
      </div>

      <div style={{ position: "absolute", top: isOutro ? 240 : 200, left: SIDE, right: SIDE }}>
        {!isOutro && (
          <div style={{ fontSize: 168, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.04em", display: "flex", alignItems: "flex-end" }}>
            {number}
            <span
              style={{
                display: "inline-block",
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: neon,
                marginLeft: 8,
                marginBottom: 14,
              }}
            />
          </div>
        )}
        <div style={{ marginTop: isOutro ? 0 : 26, fontSize: titleSize, fontWeight: 800, lineHeight: 1.2, letterSpacing: "-0.03em" }}>
          <TextLines lines={slide.heading} accentColor={neon} />
        </div>
        {slide.sub && (
          <div style={{ marginTop: 18, fontSize: 34, color: MUTED, fontWeight: 500, letterSpacing: "-0.01em" }}>{slide.sub}</div>
        )}

        {slide.body.length > 0 && (
          <div
            style={{
              marginTop: 56,
              background: "#1B1B1E",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 26,
              padding: "50px 56px 56px",
            }}
          >
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "0.28em", color: MUTED, marginBottom: 28 }}>
              {isOutro ? "SUMMARY" : "POINT"}
            </div>
            <div style={{ fontSize: bodySize, lineHeight: 1.65, fontWeight: 500, color: "#ECECEE", letterSpacing: "-0.01em" }}>
              <TextLines
                lines={slide.body}
                accentColor={neon}
                markBackground="rgba(255,255,255,0.13)"
                markColor="#FFFFFF"
                markStyle={{ fontWeight: 700, padding: "0.04em 0.28em", borderRadius: 8 }}
              />
            </div>
          </div>
        )}
      </div>

      <Footer source={source?.name} />
    </div>
  );
}

function PageNumber({ n, total, pill }: { n: number; total: number; pill?: boolean }) {
  if (pill) {
    return (
      <div
        style={{
          position: "absolute",
          top: 48,
          right: 48,
          padding: "12px 28px",
          borderRadius: 999,
          background: "rgba(0,0,0,0.5)",
          fontSize: 30,
          fontWeight: 600,
          lineHeight: 1.2,
        }}
      >
        {n}/{total}
      </div>
    );
  }
  return (
    <span>
      {String(n).padStart(2, "0")} / {String(total).padStart(2, "0")}
    </span>
  );
}

function Footer({ credit, source }: { credit?: string; source?: string }) {
  if (!credit && !source) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 48,
        right: 48,
        bottom: 34,
        display: "flex",
        justifyContent: "space-between",
        gap: 24,
        fontSize: 20,
        color: "rgba(255,255,255,0.5)",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{credit && `사진 · ${credit}`}</span>
      {source && <span>출처 · {source}</span>}
    </div>
  );
}
