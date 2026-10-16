import { CARD_HEIGHT, CARD_WIDTH } from "@/lib/cardnews";
import { legibleOn, withAlpha } from "@/lib/templates/color";
import { fitFontSize } from "@/lib/templates/fit";
import { DOC_VARIANTS } from "@/lib/templates/variants";
import { FONT_STACK, type TemplateProps } from "@/lib/templates/types";
import TextLines from "./TextLines";

/**
 * 문서 페이지. 사용자가 보낸 참고 자료("추가 4번"의 노션 스타일)를 옮겼다
 * (2026-10-16). 그림 없이 글자·선·체크박스만으로 정리된 문서 한 쪽처럼 보인다.
 *
 * - 연회색 바탕 위 흰 종이. 위에 경로("분류 / 주제")와 n/전체.
 * - 표지: 문서 아이콘 → 아주 굵은 제목(밑에 연한 형광펜 띠) → 키워드 줄
 *   ("분류 · 주제") → 가는 구분선 → 다음 장 안내.
 * - 본문: 굵은 제목 → 구분선 → **체크한 상자 + 그 장의 주제** → 본문.
 *
 * 노션 로고·화면 아이콘은 넣지 않았다. 남의 브랜드라 "문서 페이지 느낌"만
 * 가져왔다(참고 자료 문서 머리말의 원칙).
 *
 * 체크박스는 장마다 하나(그 장의 주제)만 단다. 본문 줄은 문장을 화면 폭에 맞춰
 * 끊은 조각이라, 줄마다 체크박스를 달면 "이틀간 부산…" 같은 조각이 항목처럼 보인다.
 */
export default function DocPage({ slide, total, source, variant }: TemplateProps) {
  const { base, neon } = variant ?? DOC_VARIANTS[0];
  const isCover = slide.kind === "cover";
  const ink = "#25231F";
  const muted = "#7D7A73";
  const line = "#E6E3DE";
  const hl = legibleOn(neon, "#ffffff");
  const mark = { accentColor: hl, markBackground: withAlpha(neon, 0.2), markColor: ink };
  const pagePad = 84;
  const width = CARD_WIDTH - 56 * 2 - pagePad * 2;

  const headingSize = fitFontSize({
    lines: slide.heading,
    width,
    height: isCover ? 420 : 300,
    max: isCover ? 120 : 100,
    min: isCover ? 72 : 60,
    lineHeight: 1.25,
  });
  const bodySize = fitFontSize({
    lines: slide.body,
    width: width - 70,
    height: 480,
    max: 50,
    min: 34,
    lineHeight: 1.7,
  });
  const topic = slide.sub || slide.badge;

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
        padding: 56,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          position: "relative",
          height: "100%",
          background: "#ffffff",
          borderRadius: 28,
          boxShadow: "0 6px 28px rgba(30,25,15,0.08), 0 1px 3px rgba(30,25,15,0.06)",
          padding: `${isCover ? 120 : 170}px ${pagePad}px 90px`,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          justifyContent: isCover ? "center" : "flex-start",
        }}
      >
        {/* 위: 경로와 장 수 */}
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 44,
            right: 44,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 26,
            color: muted,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <DocIcon size={30} color={muted} />
            {slide.badge}
            {!isCover && topic && topic !== slide.badge && <> / {topic}</>}
          </span>
          <span
            style={{
              borderRadius: 999,
              background: "#4A4844",
              color: "#ffffff",
              fontWeight: 600,
              fontSize: 28,
              padding: "10px 26px",
              lineHeight: 1.2,
            }}
          >
            {slide.slideNumber}/{total}
          </span>
        </div>

        {isCover ? (
          <>
            <DocIcon size={120} color={ink} />
            <div
              style={{
                marginTop: 40,
                fontSize: headingSize,
                fontWeight: 800,
                lineHeight: 1.25,
                letterSpacing: "-0.04em",
              }}
            >
              <TextLines lines={slide.heading} {...mark} />
            </div>
            {/* 제목 밑 연한 형광펜 띠 */}
            <div style={{ width: "72%", height: 14, borderRadius: 4, background: withAlpha(neon, 0.45), marginTop: 14 }} />
            {(slide.badge || slide.sub) && (
              <div style={{ marginTop: 44, fontSize: 40, color: "#55524C", display: "flex", gap: 22 }}>
                {[slide.badge, slide.sub].filter(Boolean).join("  ·  ")}
              </div>
            )}
            <div style={{ height: 2, background: line, margin: "56px 0 40px" }} />
            <div style={{ fontSize: 32, color: muted, display: "flex", alignItems: "center", gap: 14 }}>
              <CheckBox checked={false} color={muted} size={34} />
              옆으로 넘겨보세요 →
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: headingSize, fontWeight: 800, lineHeight: 1.25, letterSpacing: "-0.035em" }}>
              <TextLines lines={slide.heading} {...mark} />
            </div>
            <div style={{ height: 2, background: line, margin: "56px 0 60px" }} />
            {topic && (
              <div style={{ display: "flex", alignItems: "center", gap: 22, fontSize: 46, fontWeight: 700 }}>
                <CheckBox checked color={hl} size={50} />
                {topic}
              </div>
            )}
            {slide.body.length > 0 && (
              <div
                style={{
                  marginTop: 36,
                  marginLeft: 72,
                  fontSize: bodySize,
                  fontWeight: 400,
                  lineHeight: 1.7,
                  color: "#37352F",
                  letterSpacing: "-0.015em",
                }}
              >
                <TextLines lines={slide.body} {...mark} />
              </div>
            )}
          </>
        )}

        {source && (
          <div style={{ position: "absolute", left: pagePad, bottom: 40, fontSize: 24, color: muted }}>
            출처 · {source.name}
          </div>
        )}
      </div>
    </div>
  );
}

function DocIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
      <path
        d="M12 5 H29 L38 14 V41 A2 2 0 0 1 36 43 H12 A2 2 0 0 1 10 41 V7 A2 2 0 0 1 12 5 Z M29 5 V14 H38"
        stroke={color}
        strokeWidth={2.6}
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function CheckBox({ checked, color, size }: { checked: boolean; color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" style={{ flexShrink: 0 }}>
      <rect
        x={3}
        y={3}
        width={34}
        height={34}
        rx={6}
        fill={checked ? color : "none"}
        stroke={color}
        strokeWidth={3.5}
      />
      {checked && (
        <path d="M11 20.5 L17.5 27 L29.5 13.5" stroke="#ffffff" strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}
