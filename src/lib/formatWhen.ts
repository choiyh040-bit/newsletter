/** 저장 시각을 "오늘 14:05" / "10월 16일 14:05" 로. 미리보기의 최근 생성과 내 카드뉴스가 같이 쓴다. */
export function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const today = new Date().toDateString() === date.toDateString();
  const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  return today ? `오늘 ${time}` : `${date.getMonth() + 1}월 ${date.getDate()}일 ${time}`;
}
