import { CARD_HEIGHT, CARD_WIDTH, photoCredit } from "@/lib/cardnews";
import { accentText, gradientFor, readableOn } from "@/lib/templates/color";
import { fitFontSize } from "@/lib/templates/fit";
import { FONT_STACK, type TemplateProps } from "@/lib/templates/types";
import TextLines from "./TextLines";

/**
 * 사진 · 반투명 카드. 장마다 다른 사진을 꽉 채워 깔고 그 위에 글을 얹는다.
 *
 * 사용자가 보낸 참고 게시물(서울 신상 미술관, 서울썸머비치)을 옮긴 것이다
 * (2026-10-16). 읽어 낸 규칙:
 *
 * - **표지**는 상자 없이 사진 위에 바로 쓴다. 작은 분류(강조색, 자간 넓게) →
 *   한 줄 소제목 → 아주 큰 제목 → 맨 아래 작은 한 줄.
 * - **나머지 장**은 왼쪽 위 흰 알약에 그 장의 주제, 가운데 반투명 어두운 둥근
 *   상자에 작은 머리줄 → 굵은 제목 → 가운데 정렬 본문. 강조어는 밝은 색.
 * - 오른쪽 위에 "n/전체". 진행 점은 없다.
 *
 * 강조색은 사람이 고른다(`variant.neon`, 직접 고르기 포함). 사진 위에서는
 * 어두운 기사 색보다 노랑·민트 같은 밝은 색이 읽힌다. 고르지 않았으면 기사
 * 색을 밝힌 색(`accentText`)을 쓴다.
 *
 * 사진이 없으면(못 찾음) 기사 색 그라데이션 위에 같은 구성으로 그린다.
 */
export default function PhotoStory({ slide, accent, total, source, photo, variant }: TemplateProps) {
  const isCover = slide.kind === "cover";
  const index = slide.slideNumber - 1;
  const hl = variant?.neon ?? accentText(accent);
  const credit = photo ? photoCredit(photo) : "";
  const shadow = "0 2px 14px rgba(0,0,0,0.45)";

  // 상자 안쪽 폭: 카드 폭 - 좌우 여백(72×2) - 상자 안쪽 여백(56×2)
  const innerWidth = CARD_WIDTH - 72 * 2 - 56 * 2;
  const headingSize = fitFontSize({
    lines: slide.heading,
    width: isCover ? CARD_WIDTH - 72 * 2 : innerWidth,
    height: isCover ? 560 : 300,
    max: isCover ? 150 : 76,
    min: isCover ? 84 : 48,
    lineHeight: isCover ? 1.18 : 1.3,
  });
  const bodySize = fitFontSize({
    lines: slide.body,
    width: innerWidth,
    height: 360,
    max: 40,
    min: 30,
    lineHeight: 1.6,
  });

  const pill = {
    fontSize: 32,
    fontWeight: 700,
    padding: "14px 30px",
    borderRadius: 999,
    letterSpacing: "-0.01em",
    lineHeight: 1.2,
  } as const;

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
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 72,
        boxSizing: "border-box",
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
      {/* 사진을 고르게 어둡게. 표지는 상자가 없어 글자가 사진에 바로 얹히므로
          가운데를 조금 더 누른다. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: isCover
            ? "linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.42) 45%, rgba(0,0,0,0.5) 100%)"
            : "rgba(0,0,0,0.26)",
        }}
      />

      {/* 오른쪽 위: n/전체 */}
      <div
        style={{
          ...pill,
          position: "absolute",
          top: 56,
          right: 56,
          fontWeight: 600,
          background: "rgba(10,12,16,0.62)",
          color: "#ffffff",
        }}
      >
        {slide.slideNumber}/{total}
      </div>

      {/* 왼쪽 위: 그 장의 주제(표지에는 없다) */}
      {!isCover && (slide.sub || slide.badge) && (
        <div style={{ ...pill, position: "absolute", top: 56, left: 56, background: "#ffffff", color: "#111317" }}>
          {slide.sub || slide.badge}
        </div>
      )}

      {isCover ? (
        <div
          style={{
            position: "relative",
            width: "100%",
            marginTop: 120,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            textShadow: shadow,
          }}
        >
          {slide.badge && (
            <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "0.14em", color: hl, marginBottom: 18 }}>
              {slide.badge}
            </div>
          )}
          {slide.sub && (
            <div style={{ fontSize: 40, fontWeight: 500, color: "rgba(255,255,255,0.92)", marginBottom: 40 }}>
              {slide.sub}
            </div>
          )}
          <div style={{ fontSize: headingSize, fontWeight: 800, lineHeight: 1.18, letterSpacing: "-0.03em" }}>
            {/* 형광펜 칸은 글 상자다. 바깥 글로우가 칸 안까지 번지지 않게 끊는다. */}
            <TextLines
              lines={slide.heading}
              accentColor={hl}
              markBackground={hl}
              markColor={readableOn(hl)}
              markStyle={{ textShadow: "none" }}
            />
          </div>
          {(slide.body.length > 0 || source) && (
            <div style={{ fontSize: 30, fontWeight: 600, color: "rgba(255,255,255,0.85)", marginTop: 56 }}>
              {slide.body.length > 0 ? (
                <TextLines lines={slide.body.slice(0, 1)} accentColor={hl} />
              ) : (
                <>출처 · {source?.name}</>
              )}
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            position: "relative",
            width: "100%",
            boxSizing: "border-box",
            background: "rgba(20,22,26,0.6)",
            borderRadius: 32,
            padding: "60px 56px",
            textAlign: "center",
          }}
        >
          {slide.badge && (
            <div style={{ fontSize: 32, fontWeight: 600, color: "rgba(255,255,255,0.86)", marginBottom: 26 }}>
              {slide.badge}
            </div>
          )}
          <div style={{ fontSize: headingSize, fontWeight: 800, lineHeight: 1.3, letterSpacing: "-0.025em" }}>
            <TextLines lines={slide.heading} accentColor={hl} markBackground={hl} markColor={readableOn(hl)} />
          </div>
          {slide.body.length > 0 && (
            <div
              style={{
                fontSize: bodySize,
                fontWeight: 400,
                lineHeight: 1.6,
                color: "rgba(255,255,255,0.9)",
                marginTop: 34,
                letterSpacing: "-0.01em",
              }}
            >
              <TextLines lines={slide.body} accentColor={hl} markBackground={hl} markColor={readableOn(hl)} />
            </div>
          )}
        </div>
      )}

      {/* 맨 아래: 사진 표기(라이선스상 빼면 안 되는 사진이 있다)와 출처. 아주 작게. */}
      <div
        style={{
          position: "absolute",
          left: 56,
          right: 56,
          bottom: 30,
          display: "flex",
          justifyContent: "space-between",
          gap: 24,
          fontSize: 19,
          color: "rgba(255,255,255,0.62)",
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{credit && `사진 · ${credit}`}</span>
        {!isCover && source && <span>출처 · {source.name}</span>}
      </div>
    </div>
  );
}
