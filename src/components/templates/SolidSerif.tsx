import { CARD_HEIGHT, CARD_WIDTH } from "@/lib/cardnews";
import { shade, solidFor } from "@/lib/templates/color";
import { FONT_STACK, type TemplateProps } from "@/lib/templates/types";

/**
 * 색 배경 · 명조 · 상단 정렬.
 *
 * 반투명 카드를 쓰지 않고 단색 위에 글을 바로 올린다. 배경이 단색이라
 * 대비가 충분해서 카드가 없어도 읽히고, 그만큼 여백이 살아난다.
 *
 * GradientCenter 와 최대한 다르게 잡았다. 그쪽은 그라데이션·고딕·중앙이고
 * 이쪽은 단색·명조·좌측 상단이다. 같은 기사로 둘을 번갈아 보면 다른 세트처럼
 * 보이는 것이 목적이다.
 */
export default function SolidSerif({ slide, accent, total, source }: TemplateProps) {
  const isCover = slide.kind === "cover";
  const index = slide.slideNumber - 1;
  const rule = shade(accent, 0.45);

  return (
    <div
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        padding: "96px 88px",
        boxSizing: "border-box",
        overflow: "hidden",
        background: solidFor(accent, index, total),
        fontFamily: FONT_STACK.serif,
        color: "#ffffff",
      }}
    >
      {/* 상단: 배지와 장수. 명조에 맞춰 알약 대신 밑줄만 쓴다. */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          paddingBottom: 22,
          borderBottom: `2px solid ${rule}`,
        }}
      >
        <span style={{ fontSize: 30, fontWeight: 700, letterSpacing: "0.02em" }}>
          {slide.badge}
        </span>
        <span style={{ fontSize: 26, color: "rgba(255,255,255,0.55)", letterSpacing: "0.1em" }}>
          {String(slide.slideNumber).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
      </div>

      {/* 본문 — 위에서부터 쌓는다. 아래 여백이 그대로 남는 것이 이 템플릿의 인상이다. */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", paddingTop: isCover ? 108 : 76 }}>
        {isCover && slide.sub && (
          <div
            style={{
              fontSize: 34,
              color: shade(accent, 0.62),
              letterSpacing: "0.04em",
              marginBottom: 30,
            }}
          >
            {slide.sub}
          </div>
        )}

        <div
          style={{
            fontSize: isCover ? 84 : 58,
            fontWeight: 700,
            lineHeight: 1.42,
            letterSpacing: "-0.02em",
          }}
        >
          {slide.heading.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>

        {slide.body.length > 0 && (
          <>
            {/* 헤드라인과 본문 사이의 짧은 선. 명조의 여백을 끊어 준다. */}
            <div style={{ width: 64, height: 2, background: rule, margin: "44px 0 36px" }} />
            <div
              style={{
                fontSize: 36,
                lineHeight: 1.78,
                color: "rgba(255,255,255,0.86)",
              }}
            >
              {slide.body.map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 하단: 진행 표시 + 출처 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 24,
          borderTop: `1px solid ${shade(accent, 0.2)}`,
        }}
      >
        <div style={{ display: "flex", gap: 14 }}>
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              style={{
                width: i === index ? 36 : 8,
                height: 2,
                background: i === index ? "#ffffff" : "rgba(255,255,255,0.35)",
              }}
            />
          ))}
        </div>
        {source && (
          <div style={{ fontSize: 24, color: "rgba(255,255,255,0.6)" }}>출처 · {source.name}</div>
        )}
      </div>
    </div>
  );
}
