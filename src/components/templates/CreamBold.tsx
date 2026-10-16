import { CARD_HEIGHT, CARD_WIDTH } from "@/lib/cardnews";
import { withAlpha } from "@/lib/templates/color";
import { fitFontSize } from "@/lib/templates/fit";
import { CREAM_VARIANTS } from "@/lib/templates/variants";
import { FONT_STACK, type TemplateProps } from "@/lib/templates/types";
import TextLines from "./TextLines";

/**
 * 크림 바탕 · 굵은 고딕. 사용자가 보낸 참고 게시물("인스타 카드뉴스 성공하는
 * 방법 vs 실패하는 방법")에서 가져왔다(2026-10-16).
 *
 * 읽어 낸 규칙:
 * - 크림색 바탕에 **아주 굵은 검정** 제목. 핵심어만 **빨강**.
 * - 전부 가운데 정렬. 오른쪽 위에 회색 알약 "n/전체".
 * - 장의 주제는 **가는 가로줄 위에 얹힌 회색 알약**("읽기 쉬운 패턴", "카드뉴스 구조").
 * - 표지 아래에 "옆으로 넘겨보세요 →" 알약.
 *
 * 참고 게시물의 그림(휴대폰 화면, ✅❌ 이모지, 번호 화살표)은 그 작가가 그린
 * 것이라 자동으로 만들 수 없다. 글자·색·배치만 옮겼다.
 *
 * 강조색(빨강)은 사람이 바꿀 수 있다(`variant.neon`). 형광펜(==…==)은 강조색을
 * 옅게 깐 바탕에 검정 글자다 — 참고 게시물의 "4월에 올릴 만한"이 그렇다.
 */
export default function CreamBold({ slide, total, source, variant }: TemplateProps) {
  const { base, neon } = variant ?? CREAM_VARIANTS[0];
  const isCover = slide.kind === "cover";
  const ink = "#121212";
  const contentWidth = CARD_WIDTH - 80 * 2;

  const headingSize = fitFontSize({
    lines: slide.heading,
    width: contentWidth,
    height: isCover ? 620 : 360,
    max: isCover ? 150 : 100,
    min: isCover ? 80 : 56,
    lineHeight: 1.22,
  });
  const bodySize = fitFontSize({
    lines: slide.body,
    width: contentWidth,
    height: isCover ? 160 : 440,
    max: isCover ? 40 : 48,
    min: 32,
    lineHeight: 1.5,
  });

  const pill = { borderRadius: 999, lineHeight: 1.2, whiteSpace: "nowrap" } as const;
  const mark = { accentColor: neon, markBackground: withAlpha(neon, 0.24), markColor: ink };

  return (
    <div
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        position: "relative",
        overflow: "hidden",
        background: base,
        fontFamily: FONT_STACK.sans,
        color: ink,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "120px 80px",
        boxSizing: "border-box",
        textAlign: "center",
      }}
    >
      {/* 오른쪽 위: n/전체 */}
      <div
        style={{
          ...pill,
          position: "absolute",
          top: 56,
          right: 56,
          background: "#5C5C5C",
          color: "#ffffff",
          fontSize: 34,
          fontWeight: 600,
          padding: "14px 30px",
        }}
      >
        {slide.slideNumber}/{total}
      </div>

      {/* 제목 */}
      <div style={{ fontSize: headingSize, fontWeight: 800, lineHeight: 1.22, letterSpacing: "-0.045em" }}>
        <TextLines lines={slide.heading} {...mark} />
      </div>

      {/* 장의 주제: 가는 가로줄 위에 얹힌 회색 알약. 표지에는 소제목으로 같은 자리. */}
      {slide.sub && (
        <div style={{ display: "flex", alignItems: "center", width: CARD_WIDTH, margin: "52px -80px 0" }}>
          <div style={{ flex: 1, height: 2, background: "#A8A49C" }} />
          <div
            style={{
              ...pill,
              background: "#D9D5CC",
              color: "#3C3C3C",
              fontSize: 36,
              fontWeight: 700,
              padding: "12px 36px",
            }}
          >
            {slide.sub}
          </div>
          <div style={{ flex: 1, height: 2, background: "#A8A49C" }} />
        </div>
      )}

      {/* 본문 */}
      {slide.body.length > 0 && (
        <div
          style={{
            marginTop: 52,
            fontSize: bodySize,
            fontWeight: 700,
            lineHeight: 1.5,
            color: "#333333",
            letterSpacing: "-0.02em",
          }}
        >
          <TextLines lines={slide.body} {...mark} />
        </div>
      )}

      {/* 표지 아래: 넘겨 보라는 알약 */}
      {isCover && (
        <div
          style={{
            ...pill,
            marginTop: 72,
            background: "#E2DED5",
            color: "#5A5A5A",
            fontSize: 36,
            fontWeight: 600,
            padding: "16px 44px",
          }}
        >
          옆으로 넘겨보세요 →
        </div>
      )}

      {source && (
        <div style={{ position: "absolute", bottom: 40, left: 0, right: 0, fontSize: 22, color: "#8C8880" }}>
          출처 · {source.name}
        </div>
      )}
    </div>
  );
}
