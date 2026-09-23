/** 템플릿들이 함께 쓰는 색 계산. */

/** #rrggbb 를 밝기만 조절해서 같은 계열의 다른 색으로 만든다. */
export function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const channel = (shift: number) => {
    const value = (n >> shift) & 0xff;
    const next = amount >= 0 ? value + (255 - value) * amount : value * (1 + amount);
    return Math.round(Math.min(255, Math.max(0, next)));
  };
  return `rgb(${channel(16)}, ${channel(8)}, ${channel(0)})`;
}

/**
 * 장마다 배경에 조금씩 변화를 준다.
 *
 * 색상(hue)은 세트 전체가 포인트 컬러 하나로 통일돼야 하므로 바꾸지 않고,
 * 밝은 쪽 끝의 명도와 그라데이션 각도만 옮긴다. 넘길 때 같은 그림이 반복되는
 * 느낌을 없애면서도 한 세트로 보이게 하기 위한 것이다.
 */
export function gradientFor(accent: string, index: number, total: number): string {
  const t = total > 1 ? index / (total - 1) : 0;
  const highlight = 0.34 - t * 0.18;
  const angle = 150 + t * 45;
  return `linear-gradient(${angle}deg, ${shade(accent, highlight)} 0%, ${accent} 46%, ${shade(accent, -0.5)} 100%)`;
}

/**
 * 같은 논리를 단색에 적용한다. 그라데이션 없이 장마다 명도만 한 단계씩
 * 내려가므로, 넘길 때 세트가 한 덩어리로 읽히면서도 진행감이 생긴다.
 */
export function solidFor(accent: string, index: number, total: number): string {
  const t = total > 1 ? index / (total - 1) : 0;
  return shade(accent, -0.2 - t * 0.3);
}

/**
 * 강조한 글자에 쓸 색.
 *
 * 밝기만 올리면 흰 글자와 구별되지 않는다. 옅은 하늘색과 흰색은 카드 크기로
 * 줄여 놓으면 같은 색으로 보인다. 그래서 색상(hue)은 그대로 두고 채도를
 * 끌어올려, 흰 글자 옆에서 "다른 색"으로 읽히게 한다.
 */
export function accentText(accent: string): string {
  const { h } = hexToHsl(accent);
  return `hsl(${Math.round(h)}, 88%, 68%)`;
}

/** #rrggbb 를 색상·채도·밝기로 바꾼다. 강조색을 만들 때만 쓴다. */
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 0xff) / 255;
  const g = ((n >> 8) & 0xff) / 255;
  const b = (n & 0xff) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;

  if (d === 0) return { h: 0, s: 0, l };

  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
  else if (max === g) h = ((b - r) / d + 2) * 60;
  else h = ((r - g) / d + 4) * 60;

  return { h, s, l };
}
