import { CARD_HEIGHT, CARD_WIDTH, type CardNews, type CardSlide } from "@/lib/cardnews";

/** #rrggbb 를 밝기만 조절해서 같은 계열의 다른 색으로 만든다. */
function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const channel = (shift: number) => {
    const value = (n >> shift) & 0xff;
    const next = amount >= 0
      ? value + (255 - value) * amount
      : value * (1 + amount);
    return Math.round(Math.min(255, Math.max(0, next)));
  };
  return `rgb(${channel(16)}, ${channel(8)}, ${channel(0)})`;
}

/**
 * 카드 한 장. 항상 1080x1350 실제 크기로 그린다.
 *
 * 미리보기에서는 바깥에서 transform: scale 로 줄여 쓰고, PNG로 저장할 때는
 * 이 크기 그대로 캡처한다. 덕분에 화면에 보이는 것과 저장되는 것이 같다.
 */
export default function CardNewsCard({
  slide,
  accent,
  total,
  source,
}: {
  slide: CardSlide;
  accent: string;
  total: number;
  source: CardNews["source"];
}) {
  const isCover = slide.kind === "cover";

  return (
    <div
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        boxSizing: "border-box",
        overflow: "hidden",
        // 사진 없이 그라데이션과 타이포그래피만으로 만든다. 저작권 확인이
        // 끝난 사진이 없을 때 쓰는 기본 배경이다.
        background: `linear-gradient(155deg, ${shade(accent, 0.28)} 0%, ${accent} 45%, ${shade(accent, -0.45)} 100%)`,
        fontFamily: "'Wanted Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        color: "#ffffff",
      }}
    >
      {/* 화면 아래쪽을 눌러 글자 대비를 확보하는 비네트 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(120% 80% at 50% 0%, rgba(255,255,255,0.14) 0%, transparent 60%)",
          pointerEvents: "none",
        }}
      />

      {/* 좌상단 카테고리 배지 */}
      <div style={{ position: "relative", display: "flex" }}>
        <span
          style={{
            background: "#ffffff",
            color: shade(accent, -0.5),
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "-0.01em",
            padding: "14px 30px",
            borderRadius: 999,
          }}
        >
          {slide.badge}
        </span>
      </div>

      {/* 본문 카드 — 화면 정중앙 */}
      <div
        style={{
          position: "relative",
          background: "rgba(10, 14, 20, 0.58)",
          borderRadius: 36,
          border: "1px solid rgba(255,255,255,0.14)",
          padding: isCover ? "72px 64px" : "64px",
          display: "flex",
          flexDirection: "column",
          gap: isCover ? 28 : 32,
        }}
      >
        {isCover && slide.sub && (
          <div style={{ fontSize: 34, fontWeight: 500, color: "rgba(255,255,255,0.72)", letterSpacing: "-0.01em" }}>
            {slide.sub}
          </div>
        )}

        <div
          style={{
            fontSize: isCover ? 88 : 60,
            fontWeight: 800,
            lineHeight: 1.28,
            letterSpacing: "-0.03em",
          }}
        >
          {slide.heading.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>

        {slide.body.length > 0 && (
          <div
            style={{
              fontSize: 38,
              fontWeight: 400,
              lineHeight: 1.62,
              color: "rgba(255,255,255,0.88)",
              letterSpacing: "-0.01em",
            }}
          >
            {slide.body.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        )}
      </div>

      {/* 하단: 진행 표시 + 출처 */}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: 10 }}>
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              style={{
                width: i === slide.slideNumber - 1 ? 40 : 12,
                height: 12,
                borderRadius: 999,
                background: i === slide.slideNumber - 1 ? "#ffffff" : "rgba(255,255,255,0.38)",
              }}
            />
          ))}
        </div>
        {source && (
          <div style={{ fontSize: 24, color: "rgba(255,255,255,0.66)" }}>
            출처 · {source.name}
          </div>
        )}
      </div>
    </div>
  );
}
