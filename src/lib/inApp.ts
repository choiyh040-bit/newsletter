/**
 * 앱 안 브라우저(카카오톡·인스타그램 등에서 링크를 눌러 열린 화면)인지 알아본다. 맞으면 앱 이름.
 *
 * 이런 브라우저는 사이트가 만든 파일(blob)을 내려받는 기능을 막아 둔 경우가 많다. 사용자가
 * 카톡에서 열어 "내려받기가 중간에 꺼진다"고 했다(2026-10-17). 그래서 여기서는 파일 대신 카드
 * 이미지를 화면에 펼쳐 보여 주고 길게 눌러 저장하게 한다(`preview/page.tsx`).
 */
const IN_APP: [RegExp, string][] = [
  [/KAKAOTALK/i, "카카오톡"],
  [/Instagram/i, "인스타그램"],
  [/FBAN|FBAV|FB_IAB/i, "페이스북"],
  [/NAVER\(inapp/i, "네이버"],
  [/\bLine\//i, "라인"],
  [/DaumApps/i, "다음"],
  [/everytimeApp/i, "에브리타임"],
  [/BAND\//i, "밴드"],
  [/Whale\/.*inapp|; wv\)/i, "앱"],
];

export function inAppBrowserName(userAgent: string): string | null {
  for (const [re, name] of IN_APP) if (re.test(userAgent)) return name;
  return null;
}
