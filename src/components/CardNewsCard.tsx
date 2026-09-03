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
 * 장마다 배경에 조금씩 변화를 준다.
 *
 * 색상(hue)은 세트 전체가 포인트 컬러 하나로 통일돼야 하므로 바꾸지 않고,
 * 밝은 쪽 끝의 명도와 그라데이션 각도만 옮긴다. 5장을 넘길 때 같은 그림이
 * 반복되는 느낌을 없애면서도 한 세트로 보이게 하기 위한 것이다.
 */
function background(accent: string, index: number, total: number): string {
  const t = total > 1 ? index / (total - 1) : 0;
  const highlight = 0.34 - t * 0.18;
  const angle = 150 + t * 45;
  return `linear-gradient(${angle}deg, ${shade(accent, highlight)} 0%, ${accent} 46%, ${shade(accent, -0.5)} 100%)`;
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
  const index = slide.slideNumber - 1;

  return (
    <div
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        padding: 72,
        boxSizing: "border-box",
        overflow: "hidden",
        // 사진 없이 그라데이션과 타이포그래피만으로 만든다. 저작권 확인이
        // 끝난 사진이 없을 때 쓰는 기본 배경이다.
        background: background(accent, index, total),
        fontFamily: "'Wanted Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        color: "#ffffff",
      }}
    >
      {/* 화면 위쪽을 띄워 글자 대비를 확보하는 비네트 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(120% 80% at 50% 0%, rgba(255,255,255,0.14) 0%, transparent 60%)",
          pointerEvents: "none",
        }}
      />

      {/* 상단: 카테고리 배지 + 장수 표시 */}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
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
        <span
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: "rgba(255,255,255,0.55)",
            letterSpacing: "0.06em",
          }}
        >
          {String(slide.slideNumber).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
      </div>

      {/* 본문 카드 — 남는 공간의 정중앙 */}
      <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "center" }}>
        <div
          style={{
            width: "100%",
            // 내용이 짧은 장과 긴 장의 덩어리 크기를 맞춰, 넘길 때 본문 위치가
            // 들쭉날쭉해 보이지 않게 한다.
            minHeight: isCover ? 540 : 470,
            boxSizing: "border-box",
            background: "rgba(10, 14, 20, 0.58)",
            borderRadius: 36,
            border: "1px solid rgba(255,255,255,0.14)",
            padding: "68px 64px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: isCover ? 30 : 34,
          }}
        >
          {isCover && (
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              {/* 표지에만 두는 포인트 바. 첫 장이라는 신호를 준다. */}
              <div style={{ width: 88, height: 8, borderRadius: 999, background: shade(accent, 0.55) }} />
              {slide.sub && (
                <div style={{ fontSize: 36, fontWeight: 500, color: "rgba(255,255,255,0.74)", letterSpacing: "-0.01em" }}>
                  {slide.sub}
                </div>
              )}
            </div>
          )}

          <div
            style={{
              // 표지 헤드라인을 확실히 크게 잡아 상세 장과 위계를 벌린다.
              fontSize: isCover ? 92 : 62,
              fontWeight: 800,
              lineHeight: 1.26,
              letterSpacing: "-0.035em",
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
                width: i === index ? 40 : 12,
                height: 12,
                borderRadius: 999,
                background: i === index ? "#ffffff" : "rgba(255,255,255,0.38)",
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
