"use client";

import { CARD_HEIGHT, CARD_WIDTH } from "./cardnews";

/**
 * 올린 사진을 카드 크기(1080×1350)로 잘라 JPEG data URL 로 만든다.
 *
 * 원본을 그대로 두지 않는 이유: 결과는 브라우저 저장소(localStorage, 보통 5MB)에
 * 들어간다. 휴대폰 사진은 몇 MB 라 몇 장만 올려도 넘친다. 카드에 보이는 만큼만
 * 남기고 품질 0.8 로 줄이면 200~400KB 안팎이다.
 *
 * 가운데를 기준으로 카드 비율(4:5)에 맞게 자른다(카드에서 object-fit: cover 와 같은 결과).
 */
export async function toCardJpeg(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");

  const scale = Math.max(CARD_WIDTH / bitmap.width, CARD_HEIGHT / bitmap.height);
  const w = bitmap.width * scale;
  const h = bitmap.height * scale;
  ctx.drawImage(bitmap, (CARD_WIDTH - w) / 2, (CARD_HEIGHT - h) / 2, w, h);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.8);
}
