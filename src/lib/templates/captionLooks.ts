import type { CaptionLookId } from "@/lib/cardnews";
import type { PhotoTone } from "@/lib/photoTone";

/**
 * 사진 · 자막 템플릿의 글씨 모양 일곱 가지. 참고 자료 3번(패션 릴스 정리)의
 * "킥"은 **장마다 글씨 모양이 다르다**는 것이었다. 흰 고딕, 좁고 높은 고딕,
 * 속 빈 외곽선, 노란 명조, 검정 테두리 형광 "개큰글씨", 색 글씨.
 *
 * `on` 은 이 모양이 버티는 사진 밝기다. 속 빈 외곽선이나 색 글씨는 밝은 사진에서
 * 사라지고, 테두리 두른 스티커와 띠는 어디서나 읽힌다.
 *
 * 굵은 글씨(bold, sticker)는 사용자 제안으로 기울였다(2026-10-16). 장난스러운
 * 맛이 난다. 한글 서체에 기울임꼴이 없어 브라우저가 기울여 그린다(`oblique`).
 */
export interface CaptionLook {
  id: CaptionLookId;
  /** 미리보기 고르기 칸에 보이는 이름 */
  name: string;
  /** 이 모양이 읽히는 사진 밝기 */
  on: readonly Brightness[];
  /** 글 덩어리를 어디에 둘지 */
  place: "top" | "middle" | "bottom";
}

export type Brightness = "dark" | "mid" | "bright";

export const CAPTION_LOOKS: Record<CaptionLookId, CaptionLook> = {
  bold: { id: "bold", name: "굵은 고딕 · 기울임", on: ["dark", "mid"], place: "bottom" },
  tall: { id: "tall", name: "좁고 높은 고딕", on: ["dark", "mid"], place: "middle" },
  outline: { id: "outline", name: "외곽선 + 흰 띠", on: ["dark"], place: "bottom" },
  serif: { id: "serif", name: "명조 · 색", on: ["dark"], place: "top" },
  sticker: { id: "sticker", name: "개큰글씨 스티커", on: ["dark", "mid", "bright"], place: "middle" },
  color: { id: "color", name: "색 고딕", on: ["dark"], place: "middle" },
  band: { id: "band", name: "검정 띠 자막", on: ["dark", "mid", "bright"], place: "bottom" },
};

/** 장마다 돌아가며 쓸 차례. 이웃한 장이 같은 모양이 되지 않게 섞어 두었다. */
const ROTATION: readonly CaptionLookId[] = ["bold", "tall", "outline", "sticker", "serif", "color", "band"];

/** 글 덩어리가 놓일 자리의 밝기를 세 단계로. */
export function brightnessAt(tone: PhotoTone | null, place: CaptionLook["place"]): Brightness {
  if (!tone) return "dark";
  const v = place === "top" ? tone.top : place === "middle" ? tone.middle : tone.bottom;
  if (v >= 0.6) return "bright";
  if (v >= 0.42) return "mid";
  return "dark";
}

/**
 * 이 장의 글씨 모양. 사람이 고른 것이 있으면 그것, 없으면 사진 밝기에 맞는 것
 * 중에서 장 번호 차례대로 고른다.
 *
 * - 표지는 굵은 고딕(사진이 밝으면 스티커). 첫인상은 가장 힘 있는 글씨로.
 * - 나머지 장은 이 사진에서 읽히는 모양만 차례(`ROTATION`)대로 추린 뒤, 장 번호로
 *   돌려 고른다. 밝은 사진은 읽히는 모양이 둘(스티커·띠)뿐이라, 차례에서 다음
 *   모양을 찾는 식으로는 이웃한 두 장이 같은 스티커가 됐다. 추린 목록을 장 번호로
 *   돌리면 번갈아 나온다.
 */
export function chooseLook(
  slideNumber: number,
  isCover: boolean,
  tone: PhotoTone | null,
  chosen?: CaptionLookId
): CaptionLook {
  if (chosen) return CAPTION_LOOKS[chosen];
  const fits = (look: CaptionLook) => look.on.includes(brightnessAt(tone, look.place));
  if (isCover) return fits(CAPTION_LOOKS.bold) ? CAPTION_LOOKS.bold : CAPTION_LOOKS.sticker;
  const usable = ROTATION.map((id) => CAPTION_LOOKS[id]).filter(fits);
  return usable.length ? usable[(slideNumber - 1) % usable.length] : CAPTION_LOOKS.band;
}

/**
 * 세트 전체의 글씨 모양을 한꺼번에 정한다. 이웃한 장끼리 겹치지 않게.
 *
 * `chooseLook` 은 카드 한 장만 보고 정해서, 사진 밝기가 비슷한 장이 이어지면 같은
 * 모양이 연달아 나왔다(좁고 높은 고딕 두 번 등). 미리보기는 사진 밝기를 모두 알
 * 수 있으니 여기서 차례로 정해 카드에 넘긴다. 바로 앞 두 장에 쓴 모양은 피하고,
 * 그럴 수 없으면(밝은 사진이라 고를 게 둘뿐) 바로 앞 장 것만 피한다.
 */
export function assignLooks(
  slides: { slideNumber: number; isCover: boolean; chosen?: CaptionLookId }[],
  tones: (PhotoTone | null)[]
): CaptionLookId[] {
  const out: CaptionLookId[] = [];
  slides.forEach((s, i) => {
    if (s.chosen) return out.push(s.chosen);
    const tone = tones[i] ?? null;
    if (s.isCover) return out.push(chooseLook(s.slideNumber, true, tone).id);
    const fits = (id: CaptionLookId) => CAPTION_LOOKS[id].on.includes(brightnessAt(tone, CAPTION_LOOKS[id].place));
    const start = (s.slideNumber - 1) % ROTATION.length;
    const ordered = [...ROTATION.slice(start), ...ROTATION.slice(0, start)].filter(fits);
    const recent = out.slice(-2);
    const pick =
      ordered.find((id) => !recent.includes(id)) ?? ordered.find((id) => id !== out[out.length - 1]) ?? ordered[0];
    out.push(pick ?? "band");
  });
  return out;
}
