import { CARD_HEIGHT, CARD_WIDTH } from "@/lib/cardnews";
import { inkFor, withAlpha } from "@/lib/templates/color";
import { NEON_VARIANTS } from "@/lib/templates/variants";
import { FONT_STACK, type TemplateProps } from "@/lib/templates/types";
import TextLines from "./TextLines";

/**
 * 어두운 바탕 · 네온 한 색 · 전부 좌측 정렬.
 *
 * `docs/template-references.md` 의 A 계열을 우리 데이터에 맞게 옮긴 것이다.
 * 앞선 두 템플릿과 결정적으로 다른 점은 **색을 기사에서 뽑지 않는다**는
 * 것이다. 그쪽은 `accent` 가 배경을 만들지만 여기서는 바탕이 거의 검정으로
 * 고정이고, 네온 한 색이 그 위에서 혼자 튄다. 그래서 기사마다 색이 달라지면
 * 인상이 무너진다. 색은 사람이 `variant` 로 고른다.
 *
 * 화면을 구성하는 장치는 세 개뿐이다. 좌상단 굵은 바, 네온 라벨, 그리고
 * 우하단에서 번지는 글로우. 나머지는 전부 글자 크기와 여백으로만 만든다.
 */
export default function DarkNeon({ slide, total, source, variant }: TemplateProps) {
  // 색 조합이 없는 상태로 그릴 일은 없지만, 들어오더라도 화면이 비지 않게 한다.
  const { base, neon } = variant ?? NEON_VARIANTS[0];
  const ink = inkFor(base);

  const isCover = slide.kind === "cover";
  const isOutro = slide.kind === "outro";
  const index = slide.slideNumber - 1;

  return (
    <div
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        padding: "88px 80px",
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
      <div style={{ position: "relative" }}>
        <div style={{ width: 96, height: 10, borderRadius: 2, background: neon }} />
        {slide.badge && (
          <div
            style={{
              marginTop: 32,
              fontSize: 28,
              fontWeight: 700,
              color: neon,
              letterSpacing: "0.09em",
            }}
          >
            {slide.badge}
          </div>
        )}
      </div>

      {/* 본문. 장 종류와 무관하게 남은 공간의 가운데에 둔다.
          처음에는 상세만 위에서부터 쌓아 시작 높이를 맞췄는데, 본문이 짧은
          장에서 아래쪽 절반이 통째로 비어 실수처럼 보였다. 넘길 때 글이 조금
          움직이는 편이 빈 화면보다 낫다. */}
      <div
        style={{
          position: "relative",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontSize: isCover ? 86 : isOutro ? 72 : 60,
            fontWeight: 800,
            lineHeight: isCover ? 1.3 : 1.36,
            letterSpacing: "-0.035em",
          }}
        >
          <TextLines lines={slide.heading} accentColor={neon} />
        </div>

        {slide.body.length > 0 && (
          <div
            style={{
              marginTop: isCover ? 40 : 46,
              fontSize: isCover ? 32 : 34,
              fontWeight: 400,
              lineHeight: 1.72,
              letterSpacing: "-0.01em",
              color: ink.muted,
            }}
          >
            <TextLines lines={slide.body} accentColor={neon} />
          </div>
        )}

        {/* 표지의 작은 서명. 소제목을 헤드라인 위가 아니라 아래에 둔다.
            헤드라인이 첫 줄부터 시작해야 이 계열의 인상이 산다. */}
        {isCover && slide.sub && (
          <div
            style={{
              marginTop: 44,
              fontSize: 30,
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
        <div style={{ fontSize: 22, color: ink.faint, letterSpacing: "0.02em" }}>
          {source ? `출처 · ${source.name}` : " "}
        </div>
        <div style={{ fontSize: 22, color: ink.faint, letterSpacing: "0.12em" }}>
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </div>
      </div>
    </div>
  );
}
