import type { TextLine } from "@/lib/cardnews";

/**
 * 줄 배열을 그린다. 강조 표시가 붙은 조각만 다른 색으로 칠한다.
 *
 * 템플릿마다 같은 반복문을 쓰게 되어 한 곳으로 모았다. 강조 색은 템플릿이
 * 정해서 넘긴다. 배경이 제각각이라 잘 보이는 색도 템플릿마다 다르기 때문이다.
 */
export default function TextLines({
  lines,
  accentColor,
}: {
  lines: TextLine[];
  accentColor: string;
}) {
  return (
    <>
      {lines.map((line, i) => (
        <div key={i}>
          {line.map((span, j) => (
            <span key={j} style={span.accent ? { color: accentColor } : undefined}>
              {span.text}
            </span>
          ))}
        </div>
      ))}
    </>
  );
}
