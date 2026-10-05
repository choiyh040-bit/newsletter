import { CARD_HEIGHT, CARD_WIDTH } from "@/lib/cardnews";
import { inkFor, readableOn, withAlpha } from "@/lib/templates/color";
import { fitFontSize } from "@/lib/templates/fit";
import { NEON_VARIANTS } from "@/lib/templates/variants";
import { FONT_STACK, type TemplateProps } from "@/lib/templates/types";
import TextLines from "./TextLines";

/**
 * 어두운 바탕 · 네온 한 색.
 *
 * `docs/template-references.md` 의 A 계열을 우리 데이터에 맞게 옮긴 것이다.
 * 앞선 두 템플릿과 결정적으로 다른 점은 **색을 기사에서 뽑지 않는다**는
 * 것이다. 그쪽은 `accent` 가 배경을 만들지만 여기서는 바탕이 거의 검정으로
 * 고정이고, 네온 한 색이 그 위에서 혼자 튄다. 그래서 기사마다 색이 달라지면
 * 인상이 무너진다. 색은 사람이 `variant` 로 고른다.
 *
 * 화면을 구성하는 장치는 세 개뿐이다. 굵은 바, 네온 라벨, 그리고 우하단에서
 * 번지는 글로우. 나머지는 전부 글자 크기와 여백으로만 만든다.
 *
 * 정렬은 기본이 좌측이다. 참고 자료 A 가 전부 좌측이기도 하고, 본문이 길면
 * 중앙은 읽기 어렵다. 짧고 단정적인 세트를 위해 중앙도 열어 뒀다.
 */
export default function DarkNeon({ slide, total, source, variant, align }: TemplateProps) {
  // 색 조합이 없는 상태로 그릴 일은 없지만, 들어오더라도 화면이 비지 않게 한다.
  const { base, neon } = variant ?? NEON_VARIANTS[0];
  const ink = inkFor(base);

  const centered = align === "center";

  const isCover = slide.kind === "cover";
  const isOutro = slide.kind === "outro";
  const index = slide.slideNumber - 1;

  // 글이 쓸 수 있는 칸. 좌우 여백과, 위아래로 붙는 것들(바·라벨·서명·하단 줄)을
  // 뺀 값이다. 헤드라인은 이 칸을 꽉 채우도록 크기가 정해진다.
  const isDetail = !isCover && !isOutro;
  const hasNote = isDetail && slide.note.length > 0;

  const contentWidth = CARD_WIDTH - 72 * 2;
  const bodyLines = slide.body.length;

  const bodyLineHeight = 1.62;
  const bodyGap = 44;
  // 본문도 칸에 맞춘다. 숫자로 박아 두면 줄이 짧은 장에서 혼자 작게 남는다.
  const bodySize = fitFontSize({
    lines: slide.body,
    width: contentWidth,
    height: 520,
    max: isCover ? 54 : 64,
    min: 34,
    lineHeight: bodyLineHeight,
  });

  // 결론 상자 높이. 글줄 + 안쪽 여백 + 테두리 + 위 간격.
  const NOTE_SIZE = 38;
  const noteHeight = hasNote ? slide.note.length * NOTE_SIZE * 1.5 + 60 + 4 + 44 : 0;

  /**
   * 헤드라인이 쓸 수 있는 높이.
   *
   * 본문과 결론 상자의 높이를 **어림하지 않고 실제 값으로** 뺀다. 한 번
   * 어림짐작으로 뒀다가 본문이 상한까지 찼을 때 80px 쯤 모자랐고, 넘친 만큼
   * 하단의 출처·장수가 카드 밖으로 밀려 나갔다. 넘치는 것이 글자가 아니라
   * 다른 요소라서 눈에 잘 안 띄었다.
   */
  const headingRoom =
    CARD_HEIGHT -
    84 * 2 - // 위아래 여백
    130 - // 바 + 카테고리 라벨
    60 - // 하단 출처·장수
    (isDetail ? 150 : 0) - // 큰 번호
    (bodyLines > 0 ? bodyLines * bodySize * bodyLineHeight + bodyGap : 0) -
    noteHeight -
    (isCover && slide.sub ? 82 : 0) -
    (isOutro ? 128 : 0);

  const headingLineHeight = isCover ? 1.08 : 1.24;
  const headingSize = fitFontSize({
    lines: slide.heading,
    width: contentWidth,
    height: headingRoom,
    // 표지는 글줄이 서너 자까지 짧아지므로 상한을 높게 연다.
    max: isCover ? 168 : isOutro ? 118 : 96,
    min: isCover ? 72 : 52,
    lineHeight: headingLineHeight,
  });

  return (
    <div
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        padding: "84px 72px",
        boxSizing: "border-box",
        overflow: "hidden",
        background: base,
        fontFamily: FONT_STACK.sans,
        color: ink.strong,
      }}
    >
      {/* 아주 옅은 격자. 단색 바탕이 인쇄물처럼 납작해 보이는 것을 막는다.
          눈에 띄면 실패한 것이므로 알파를 아주 낮게 둔다. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `repeating-linear-gradient(0deg, ${ink.grid} 0 1px, transparent 1px 90px), repeating-linear-gradient(90deg, ${ink.grid} 0 1px, transparent 1px 90px)`,
          pointerEvents: "none",
        }}
      />

      {/* 우하단 글로우. 네온 한 색을 배경에도 한 번 풀어 놓아, 포인트 컬러가
          글자에만 찍힌 스티커처럼 떠 보이지 않게 한다. */}
      <div
        style={{
          position: "absolute",
          right: -160,
          bottom: -200,
          width: 900,
          height: 760,
          background: `radial-gradient(50% 50% at 50% 50%, ${withAlpha(neon, ink.glow)} 0%, ${withAlpha(neon, ink.glow * 0.32)} 45%, transparent 72%)`,
          pointerEvents: "none",
        }}
      />

      {/* 상단: 모든 장에 공통으로 들어가는 바 + 카테고리 라벨.
          SKILL.md 는 흰 알약 배지를 쓰라고 하지만, 이 계열은 면을 쓰지 않고
          선과 색으로만 위계를 만든다. 알약을 얹으면 그 원칙이 깨진다. */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: centered ? "center" : "flex-start",
          textAlign: centered ? "center" : "left",
        }}
      >
        <div style={{ width: 96, height: 10, borderRadius: 2, background: neon }} />
        {/* 라벨을 두 조각으로 나눈다. 분류는 포인트 컬러로, 그 장이 무엇을
            다루는지는 흐린 글씨로. 참고 자료 E 가 "TYPE 01 + 샹년의 특징"
            처럼 쓰는 방식이다. 배지 하나만 두면 모든 장에 같은 글자가
            박혀서 장을 구분하는 일을 전혀 못 한다. */}
        {(slide.badge || (isDetail && slide.sub)) && (
          <div
            style={{
              marginTop: 32,
              display: "flex",
              alignItems: "baseline",
              gap: 18,
              flexWrap: "wrap",
              justifyContent: centered ? "center" : "flex-start",
            }}
          >
            {slide.badge && (
              <span
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  color: neon,
                  letterSpacing: "0.09em",
                }}
              >
                {slide.badge}
              </span>
            )}
            {isDetail && slide.sub && (
              <span
                style={{
                  fontSize: 28,
                  fontWeight: 500,
                  color: ink.faint,
                  letterSpacing: "0.04em",
                }}
              >
                {slide.sub}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 본문.
          표지와 마무리는 가운데, 상세는 **위에서부터** 쌓는다.

          한동안 상세도 가운데에 뒀다. 본문이 짧은 장에서 아래 절반이 비는
          것이 싫어서였다. 그런데 그렇게 하면 위아래로 빈 자리가 반씩 쪼개져
          **양쪽 다 어중간하게** 빈다. 참고 자료를 재 보니 그쪽은 라벨 바로
          아래부터 글이 시작하고, 남는 자리는 아래 한 군데로 몰려 있었다.
          빈 자리는 나누지 말고 한쪽으로 몰아야 덜 비어 보인다. 아래쪽은
          글로우가 받쳐 준다. */}
      <div
        style={{
          position: "relative",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: isCover || isOutro ? "center" : "flex-start",
          paddingTop: isCover || isOutro ? 0 : 36,
          // 계산이 빗나가더라도 하단 출처·장수를 밀어내지는 않게 한다.
          minHeight: 0,
          overflow: "hidden",
          alignItems: centered ? "center" : "stretch",
          textAlign: centered ? "center" : "left",
        }}
      >
        {/* 큰 번호. 글자만 있는 화면에서 숫자가 도형 노릇을 한다.
            참고 자료 E 의 정보 장은 전부 이걸 앵커로 쓴다. 데이터는
            이미 있던 것(장 번호)이라 새로 받을 것이 없다. */}
        {isDetail && (
          <div style={{ marginBottom: 26 }}>
            <div
              style={{
                fontSize: 128,
                fontWeight: 800,
                lineHeight: 0.92,
                letterSpacing: "-0.04em",
              }}
            >
              {String(slide.slideNumber).padStart(2, "0")}
            </div>
            <div
              style={{
                width: 108,
                height: 8,
                background: neon,
                marginTop: 14,
                marginLeft: centered ? "auto" : 0,
                marginRight: centered ? "auto" : 0,
              }}
            />
          </div>
        )}

        <div
          style={{
            fontSize: headingSize,
            fontWeight: 800,
            lineHeight: headingLineHeight,
            letterSpacing: "-0.035em",
          }}
        >
          <TextLines
            lines={slide.heading}
            accentColor={neon}
            markBackground={neon}
            markColor={readableOn(neon)}
          />
        </div>

        {slide.body.length > 0 && (
          <div
            style={{
              marginTop: isCover ? 44 : bodyGap,
              fontSize: bodySize,
              fontWeight: 400,
              lineHeight: bodyLineHeight,
              letterSpacing: "-0.01em",
              color: ink.muted,
            }}
          >
            <TextLines
              lines={slide.body}
              accentColor={neon}
              markBackground={neon}
              markColor={readableOn(neon)}
            />
          </div>
        )}

        {/* 결론 상자.
            데이터를 늘어놓고 끝내지 않고, 그 장에서 남길 한 마디를 테두리
            안에 따로 둔다. body 안에 섞으면 같은 무게로 깔려서 결론이
            아니라 넷째 줄이 된다. 참고 자료 E 의 정보 장이 거의 다 이렇게
            끝났다. */}
        {hasNote && (
          <div
            style={{
              marginTop: 44,
              border: `2px solid ${withAlpha(neon, 0.55)}`,
              borderRadius: 10,
              padding: "30px 34px",
              display: "flex",
              gap: 22,
              alignItems: "flex-start",
              textAlign: "left",
            }}
          >
            {/* 작은 네모 하나. 상자가 그냥 테두리로만 끝나지 않게 한다. */}
            <div
              style={{
                width: 18,
                height: 18,
                background: neon,
                flexShrink: 0,
                marginTop: 12,
              }}
            />
            <div
              style={{
                fontSize: 38,
                fontWeight: 600,
                lineHeight: 1.5,
                letterSpacing: "-0.01em",
                color: ink.strong,
              }}
            >
              <TextLines
                lines={slide.note}
                accentColor={neon}
                markBackground={neon}
                markColor={readableOn(neon)}
              />
            </div>
          </div>
        )}

        {/* 표지의 작은 서명. 소제목을 헤드라인 위가 아니라 아래에 둔다.
            헤드라인이 첫 줄부터 시작해야 이 계열의 인상이 산다. */}
        {isCover && slide.sub && (
          <div
            style={{
              marginTop: 48,
              fontSize: 34,
              fontWeight: 500,
              color: ink.faint,
              letterSpacing: "0.01em",
            }}
          >
            {slide.sub}
          </div>
        )}

        {/* 마무리 장의 아래 화살표. 캡션 쪽으로 시선을 내린다.
            글꼴의 화살표 글자를 쓰면 PNG로 구울 때 빠질 수 있어 직접 그린다. */}
        {isOutro && (
          <svg
            width="58"
            height="72"
            viewBox="0 0 58 72"
            fill="none"
            style={{ marginTop: 56 }}
          >
            <path
              d="M29 4 V64 M7 42 L29 64 L51 42"
              stroke={neon}
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>

      {/* 하단: 좌측 출처, 우측 장수. 둘 다 워터마크처럼 흐리게 둔다. */}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 26,
          borderTop: `1px solid ${ink.hairline}`,
        }}
      >
        <div style={{ fontSize: 24, color: ink.faint, letterSpacing: "0.02em" }}>
          {source ? `출처 · ${source.name}` : " "}
        </div>
        <div style={{ fontSize: 24, color: ink.faint, letterSpacing: "0.12em" }}>
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </div>
      </div>
    </div>
  );
}
