import type { TemplateProps } from "@/lib/templates/types";
import DarkNeon from "./DarkNeon";

/**
 * 네온·흰 바탕 레이아웃의 명조 버전. 레이아웃은 그대로, 서체만 명조다.
 *
 * 컴포넌트를 따로 만들지 않고 `font` 만 넘긴다. 레이아웃을 고치면 고딕과
 * 명조가 함께 바뀌어야 하기 때문이다. 둘이 갈라지면 같은 디자인이 아니다.
 */
export default function DarkNeonSerif(props: TemplateProps) {
  return <DarkNeon {...props} font="serif" />;
}
