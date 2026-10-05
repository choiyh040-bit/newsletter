import type { TextLine } from "@/lib/cardnews";

/**
 * 줄 배열을 그린다. 표시가 붙은 조각만 다르게 칠한다.
 *
 * 꾸밈이 두 가지다.
 *
 * - `accent` — 글자 색만 바꾼다. 가벼운 쪽.
 * - `mark` — 형광펜처럼 뒤에 색을 깐다. 센 쪽.
 *
 * 색은 템플릿이 정해서 넘긴다. 배경이 제각각이라 잘 보이는 색도 템플릿마다
 * 다르기 때문이다.
 */
export default function TextLines({
  lines,
  accentColor,
  markBackground,
  markColor,
}: {
  lines: TextLine[];
  accentColor: string;
  /** 형광펜 색. 없으면 형광펜 조각도 그냥 accent 로 그린다. */
  markBackground?: string;
  /** 형광펜 위에 올릴 글자색. */
  markColor?: string;
}) {
  return (
    <>
      {lines.map((line, i) => (
        <div key={i}>
          {line.map((span, j) => {
            if (span.style === "mark" && markBackground) {
              return (
                <span
                  key={j}
                  style={{
                    background: markBackground,
                    color: markColor,
                    // 글자를 좌우로만 살짝 띄운다. 위아래로 키우면 줄 간격이
                    // 밀려서 형광펜이 붙은 줄만 내려앉는다.
                    padding: "0 0.1em",
                    borderRadius: 4,
                    // 줄이 넘어가도 조각이 쪼개지지 않게 한다.
                    boxDecorationBreak: "clone",
                    WebkitBoxDecorationBreak: "clone",
                  }}
                >
                  {span.text}
                </span>
              );
            }
            return (
              <span
                key={j}
                style={span.style === "plain" ? undefined : { color: accentColor }}
              >
                {span.text}
              </span>
            );
          })}
        </div>
      ))}
    </>
  );
}
