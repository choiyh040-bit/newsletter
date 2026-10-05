import { lineText, type TextLine } from "@/lib/cardnews";

/**
 * 글 덩어리가 주어진 칸을 꽉 채우도록 글자 크기를 구한다.
 *
 * 사진 없이 글자로만 만드는 카드에서 "텅 비어 보인다"의 원인은 글자 크기가
 * 아니었다. 참고 자료와 우리 표지를 나란히 재 보니 **줄 높이는 거의 같았다**
 * (카드 높이의 7.2% 대 7.1%). 차이는 줄 수였다. 참고 자료는 여섯 줄이고
 * 우리는 세 줄이라, 헤드라인 덩어리가 차지하는 면적이 66% 대 24% 였다.
 *
 * 참고 자료가 그렇게 생긴 이유는 **한 줄이 서너 글자**이기 때문이다. 줄이
 * 짧으니 글자를 키울 수 있고, 글자가 크니 줄이 늘어난다. 크기를 숫자로
 * 박아 두면 이게 안 된다. 짧은 줄은 작게 남고 긴 줄은 넘친다.
 *
 * 그래서 고정값 대신 **칸에 맞춰 계산한다.** 가로로는 가장 긴 줄이 들어가야
 * 하고, 세로로는 전체 줄이 들어가야 한다. 둘 중 빡빡한 쪽을 따른다.
 */
export function fitFontSize({
  lines,
  width,
  height,
  max,
  min,
  lineHeight,
  charWidth = 0.95,
}: {
  lines: TextLine[];
  /** 글이 쓸 수 있는 가로 폭 (px) */
  width: number;
  /** 글이 쓸 수 있는 세로 높이 (px) */
  height: number;
  max: number;
  min: number;
  lineHeight: number;
  /**
   * 글자 하나가 차지하는 가로 폭, em 단위.
   *
   * 한글은 거의 정사각형이라 1em 에 가깝다. 자간을 좁히고 있어 0.95 로 둔다.
   * 숫자와 영문이 섞이면 이보다 좁아지므로, 이 값은 **넘치지 않는 쪽으로
   * 넉넉하게** 잡은 것이다.
   */
  charWidth?: number;
}): number {
  if (lines.length === 0) return min;

  const longest = lines.reduce((n, line) => Math.max(n, lineText(line).length), 1);
  const byWidth = width / (longest * charWidth);
  const byHeight = height / (lines.length * lineHeight);

  return Math.round(Math.max(min, Math.min(max, byWidth, byHeight)));
}
