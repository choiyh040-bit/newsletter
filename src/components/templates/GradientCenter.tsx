import { CARD_HEIGHT, CARD_WIDTH, photoCredit } from "@/lib/cardnews";
import { accentText, gradientFor, shade, readableOn, withAlpha } from "@/lib/templates/color";
import { FONT_STACK, type TemplateProps } from "@/lib/templates/types";
import TextLines from "./TextLines";

/**
 * 색 배경 · 고딕 · 중앙 카드.
 *
 * 그라데이션 위에 반투명 다크 카드를 얹고 그 안에 글을 넣는다. 사진 없이
 * 완결되는 기본 템플릿이다.
 *
 * `photo` 가 오면 같은 구성에 **사진을 바탕에 깐다**(사진 · 그라데이션 · 고딕).
 * 사진 위에 기사 색 그라데이션을 반투명하게 덮어 세트가 한 색으로 묶이고
 * 글자도 읽히게 한다. 표지는 사진이 보이게 옅게, 상세 장은 글이 우선이라
 * 진하게 덮는다. 사진이 없으면 그라데이션만으로 그린다(사진 못 찾은 경우).
 */
export default function GradientCenter({ slide, accent, total, source, photo }: TemplateProps) {
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
        background: gradientFor(accent, index, total),
        fontFamily: FONT_STACK.sans,
        color: "#ffffff",
      }}
    >
      {photo && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- PNG 로 구울 때 그대로 담기려면 평범한 img 여야 한다 */}
          <img
            src={photo.url}
            alt=""
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(180deg, ${withAlpha(accent, isCover ? 0.35 : 0.72)} 0%, ${withAlpha(accent, isCover ? 0.55 : 0.82)} 55%, rgba(6,10,16,${isCover ? 0.82 : 0.9}) 100%)`,
            }}
          />
        </>
      )}

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
            <TextLines

              lines={slide.heading}

              accentColor={accentText(accent)}

              markBackground={accentText(accent)}

              markColor={readableOn(accentText(accent))}

            />
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
              <TextLines

                lines={slide.body}

                accentColor={accentText(accent)}

                markBackground={accentText(accent)}

                markColor={readableOn(accentText(accent))}

              />
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

      {/* 사진 작가 표기. CC BY 계열은 표기가 의무다. 장마다 따로 게시될 수
          있으므로 모든 장에 단다. */}
      {photo && photoCredit(photo) && (
        <div
          style={{
            position: "relative",
            marginTop: 14,
            fontSize: 19,
            color: "rgba(255,255,255,0.55)",
            textAlign: "right",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          사진 · {photoCredit(photo)}
        </div>
      )}
    </div>
  );
}
