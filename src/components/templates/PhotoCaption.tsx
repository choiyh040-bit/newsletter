import type { CSSProperties } from "react";
import { CARD_HEIGHT, CARD_WIDTH, photoCredit, type TextLine } from "@/lib/cardnews";
import { usePhotoTone } from "@/lib/photoTone";
import { brightnessAt, chooseLook, type CaptionLook } from "@/lib/templates/captionLooks";
import { gradientFor, readableOn } from "@/lib/templates/color";
import { fitFontSize } from "@/lib/templates/fit";
import { CAPTION_VARIANTS } from "@/lib/templates/variants";
import { FONT_STACK, type TemplateProps } from "@/lib/templates/types";
import TextLines from "./TextLines";

/**
 * 사진 · 자막. 참고 자료 3번(패션 릴스 정리)을 옮겼다.
 *
 * 처음 판(2026-10-16 오전)은 배치만 따라 했다. 모든 장이 같은 흰 고딕이었고
 * 읽히라고 아래를 어둡게 덮었더니 뉴스 화면이 됐다. 사용자가 "3번이 반영이 안 됐다,
 * 3번이 진짜 킥"이라고 해서 다시 만들었다. 3번의 킥은 셋이다.
 *
 * 1. **글씨가 주인공이고 장마다 모양이 다르다.** → 일곱 가지 모양(`captionLooks.ts`).
 * 2. **사진을 덮지 않는다.** → 읽히는 것은 글씨 자신의 그림자·테두리·띠로. 사진이
 *    중간 밝기일 때만 글 덩어리 뒤를 옅게 누른다.
 * 3. **글이 짧다.** → 이 템플릿을 고르고 만들면 제목 두세 줄과 짧은 한 줄로 쓴다
 *    (생성 프롬프트의 자막형).
 *
 * 원작자는 사진을 보고 글씨를 골랐다. 우리는 사진을 자동으로 찾으므로 사진 밝기를
 * 재서(`usePhotoTone`) 그 자리에서 읽히는 모양만 고른다. 미리보기에서 장마다 바꿀 수 있다.
 */
const SHADOW = "0 0 2px rgba(0,0,0,0.6), 0 3px 12px rgba(0,0,0,0.5), 0 0 36px rgba(0,0,0,0.3)";
const SIDE = 80;

export default function PhotoCaption({ slide, accent, total, source, photo, variant }: TemplateProps) {
  const { neon } = variant ?? CAPTION_VARIANTS[0];
  const isCover = slide.kind === "cover";
  const index = slide.slideNumber - 1;
  const tone = usePhotoTone(photo?.url);
  const look = chooseLook(slide.slideNumber, isCover, tone, slide.captionLook);
  const light = brightnessAt(tone, look.place);
  const credit = photo ? photoCredit(photo) : "";

  // 작은 줄: 표지는 소제목, 상세는 본문. 라벨을 쓰는 모양은 소제목을 라벨로 올린다.
  const usesLabel = look.id === "outline" || look.id === "band";
  const label = usesLabel ? (isCover ? slide.badge : slide.sub || slide.badge) : "";
  const small: TextLine[] = isCover
    ? slide.sub && !usesLabel
      ? [[{ text: slide.sub, style: "plain" }]]
      : slide.body
    : slide.body;

  return (
    <div
      // 어떤 모양이 골라졌는지(시험·디버깅용). 화면에는 영향이 없다.
      data-caption-look={look.id}
      data-caption-light={light}
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
      {/* 오른쪽 위 장 수가 읽히도록 위만 아주 옅게. 나머지 사진은 그대로 둔다. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0) 14%)",
        }}
      />
      <Shade place={look.place} strength={shadeFor(look, light)} />

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

      <div style={blockStyle(look.place)}>
        {label && <Label look={look} text={label} />}
        <Heading look={look} lines={slide.heading} neon={neon} isCover={isCover} />
        {small.length > 0 && <Small look={look} lines={small} neon={neon} />}
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
          color: "rgba(255,255,255,0.78)",
          textShadow: "0 1px 4px rgba(0,0,0,0.6)",
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{credit && `사진 · ${credit}`}</span>
        {source && <span>출처 · {source.name}</span>}
      </div>
    </div>
  );
}

/** 글 덩어리의 자리. 위·가운데·아래. */
function blockStyle(place: CaptionLook["place"]): CSSProperties {
  const base: CSSProperties = {
    position: "absolute",
    left: SIDE,
    right: SIDE,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  };
  if (place === "top") return { ...base, top: 170 };
  if (place === "bottom") return { ...base, bottom: 120 };
  return { ...base, top: 0, bottom: 0, justifyContent: "center", paddingTop: 80 };
}

/**
 * 글 덩어리 뒤를 얼마나 누를지. 그림자만으로 버티는 모양(흰 글씨·색 글씨)이
 * 중간 밝기 사진에 놓일 때만 누른다. 스티커와 띠는 스스로 읽힌다.
 */
function shadeFor(look: CaptionLook, light: "dark" | "mid" | "bright"): number {
  if (look.id === "sticker" || look.id === "band") return light === "bright" ? 0 : 0.12;
  return light === "dark" ? 0.18 : 0.42;
}

function Shade({ place, strength }: { place: CaptionLook["place"]; strength: number }) {
  if (strength <= 0) return null;
  const a = (k: number) => `rgba(0,0,0,${(strength * k).toFixed(3)})`;
  const background =
    place === "top"
      ? `linear-gradient(180deg, ${a(0.6)} 0%, ${a(1)} 22%, ${a(0.6)} 42%, rgba(0,0,0,0) 58%)`
      : place === "bottom"
        ? `linear-gradient(0deg, ${a(1)} 0%, ${a(0.9)} 30%, ${a(0.4)} 50%, rgba(0,0,0,0) 64%)`
        : `radial-gradient(ellipse 75% 38% at 50% 54%, ${a(1)} 0%, ${a(0.6)} 55%, rgba(0,0,0,0) 100%)`;
  return <div style={{ position: "absolute", inset: 0, background }} />;
}

/** 모양마다 서체·굵기·글자 폭(em). 글자 폭은 크기 계산에 쓴다. */
const TYPE: Record<CaptionLook["id"], { family: string; weight: number; charWidth: number; lineHeight: number }> = {
  bold: { family: FONT_STACK.sans, weight: 800, charWidth: 1.0, lineHeight: 1.15 },
  tall: { family: "'Do Hyeon', 'Wanted Sans', sans-serif", weight: 400, charWidth: 0.8, lineHeight: 1.1 },
  outline: { family: FONT_STACK.sans, weight: 800, charWidth: 1.0, lineHeight: 1.14 },
  serif: { family: FONT_STACK.serif, weight: 700, charWidth: 1.05, lineHeight: 1.28 },
  sticker: { family: "'Black Han Sans', 'Wanted Sans', sans-serif", weight: 400, charWidth: 0.98, lineHeight: 1.1 },
  color: { family: FONT_STACK.sans, weight: 700, charWidth: 0.97, lineHeight: 1.2 },
  band: { family: FONT_STACK.sans, weight: 800, charWidth: 1.0, lineHeight: 1.38 },
};

/** 굵은 두 모양을 기울인다. 글자 위치가 밀리지 않게 덩어리째 기울인다. */
const TILT = "skewX(-9deg)";

function Heading({
  look,
  lines,
  neon,
  isCover,
}: {
  look: CaptionLook;
  lines: TextLine[];
  neon: string;
  isCover: boolean;
}) {
  const t = TYPE[look.id];
  const size = fitFontSize({
    lines,
    width: CARD_WIDTH - SIDE * 2 - (look.id === "sticker" ? 40 : look.id === "band" ? 60 : 0),
    height: isCover ? 560 : look.place === "middle" ? 520 : 440,
    max: look.id === "sticker" ? 200 : look.id === "tall" ? 160 : look.id === "band" ? 92 : isCover ? 136 : 120,
    min: look.id === "band" ? 56 : 64,
    lineHeight: t.lineHeight,
    charWidth: t.charWidth,
  });
  const box: CSSProperties = {
    fontFamily: t.family,
    fontWeight: t.weight,
    fontSize: size,
    lineHeight: t.lineHeight,
    letterSpacing: look.id === "tall" || look.id === "sticker" ? "0" : "-0.035em",
  };
  const mark = { markBackground: neon, markColor: readableOn(neon) };

  switch (look.id) {
    case "bold":
      return (
        <div style={{ ...box, textShadow: SHADOW, transform: TILT }}>
          <TextLines lines={lines} accentColor={neon} {...mark} />
        </div>
      );
    case "tall":
      return (
        <div style={{ ...box, textShadow: SHADOW }}>
          <TextLines lines={lines} accentColor={neon} {...mark} />
        </div>
      );
    case "outline":
      // 속 빈 외곽선. 강조어만 색으로 채운다.
      return (
        <div
          style={{
            ...box,
            color: "transparent",
            WebkitTextStroke: `${Math.max(3, Math.round(size / 42))}px #ffffff`,
            filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.55))",
          }}
        >
          <TextLines lines={lines} accentColor={neon} markBackground={neon} markColor="#111111" />
        </div>
      );
    case "serif":
      return (
        <div style={{ ...box, color: neon, textShadow: SHADOW }}>
          <TextLines lines={lines} accentColor="#ffffff" markBackground="#ffffff" markColor="#111111" />
        </div>
      );
    case "sticker":
      // 형광 글씨에 두꺼운 검정 테두리. 테두리를 글자 뒤에 깔아(paint-order) 획이 먹히지 않게.
      return (
        <div
          style={{
            ...box,
            color: neon,
            WebkitTextStroke: `${Math.round(size / 13)}px #111111`,
            paintOrder: "stroke fill",
            transform: TILT,
            filter: "drop-shadow(0 6px 0 rgba(0,0,0,0.35))",
          }}
        >
          <TextLines lines={lines} accentColor="#ffffff" markBackground="#ffffff" markColor="#111111" />
        </div>
      );
    case "color":
      return (
        <div style={{ ...box, color: neon, textShadow: SHADOW }}>
          <TextLines lines={lines} accentColor="#ffffff" markBackground="#ffffff" markColor="#111111" />
        </div>
      );
    case "band":
      // 줄마다 검정 띠. 강조어는 고른 색 글씨.
      return (
        <div style={{ ...box, transform: TILT }}>
          {lines.map((line, i) => (
            <div key={i} style={{ marginTop: i ? 10 : 0 }}>
              <span style={{ background: "#111111", padding: "2px 22px", boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" }}>
                {line.map((span, j) => (
                  <span
                    key={j}
                    style={
                      span.style === "plain"
                        ? undefined
                        : span.style === "mark"
                          ? { background: neon, color: readableOn(neon), padding: "0 0.1em" }
                          : { color: neon }
                    }
                  >
                    {span.text}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>
      );
  }
}

/** 소제목 띠(외곽선·띠 모양에서). 흰 바탕에 검정 글씨. */
function Label({ look, text }: { look: CaptionLook; text: string }) {
  return (
    <div
      style={{
        background: "#ffffff",
        color: "#111111",
        fontSize: 44,
        fontWeight: 700,
        padding: "10px 30px",
        marginBottom: look.id === "band" ? 26 : 34,
        lineHeight: 1.25,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
}

/** 제목 아래 작은 줄. 늘 흰색. 서체는 제목 모양을 따라간다. */
function Small({ look, lines, neon }: { look: CaptionLook; lines: TextLine[]; neon: string }) {
  const family =
    look.id === "tall" ? TYPE.tall.family : look.id === "serif" ? FONT_STACK.serif : FONT_STACK.sans;
  const size = fitFontSize({
    lines,
    width: CARD_WIDTH - SIDE * 2,
    height: 230,
    max: look.id === "tall" ? 54 : 44,
    min: 32,
    lineHeight: 1.45,
    charWidth: look.id === "tall" ? 0.8 : 0.97,
  });
  return (
    <div
      style={{
        marginTop: look.id === "sticker" ? 34 : 26,
        fontFamily: family,
        fontWeight: look.id === "tall" ? 400 : 700,
        fontSize: size,
        lineHeight: 1.45,
        color: "rgba(255,255,255,0.96)",
        textShadow: SHADOW,
        letterSpacing: look.id === "tall" ? "0" : "-0.015em",
      }}
    >
      <TextLines lines={lines} accentColor={neon} markBackground={neon} markColor={readableOn(neon)} />
    </div>
  );
}
