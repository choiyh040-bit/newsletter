"use client";

import { useEffect, useState } from "react";

/**
 * 사진의 밝기를 잰다. 사진 · 자막 템플릿이 장마다 글씨 모양을 고를 때 쓴다.
 *
 * 참고 자료 3번은 상자 없이 사진 위에 글씨만 얹는다. 원작자는 사진을 보고 그에
 * 맞는 글씨를 골랐다(어두운 사진에 외곽선·민트, 밝은 사진엔 테두리 두른 굵은 글씨).
 * 우리는 사진을 자동으로 찾으므로 그 판단을 코드가 해야 한다. 시안에서 흰 회의실
 * 사진에 외곽선 글씨를 얹었더니 글씨가 사라졌다(2026-10-16).
 *
 * 사진을 가로 36 × 세로 45 로 줄여 그린 뒤 위·가운데·아래 세 띠의 평균 밝기(0~1)를
 * 구한다. 사진은 모두 같은 출처(`/api/photo`, 올린 사진은 data: 주소)라 캔버스가
 * 막히지 않는다. 결과는 주소별로 기억한다. 같은 사진을 미리보기·내보내기용 카드가
 * 함께 그리기 때문이다.
 */
export interface PhotoTone {
  /** 위 띠(15~45%)의 평균 밝기 */
  top: number;
  /** 가운데 띠(35~70%) */
  middle: number;
  /** 아래 띠(55~90%) */
  bottom: number;
}

const cache = new Map<string, PhotoTone | null>();
const pending = new Map<string, Promise<PhotoTone | null>>();

function measure(url: string): Promise<PhotoTone | null> {
  const known = pending.get(url);
  if (known) return known;
  const job = new Promise<PhotoTone | null>((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      try {
        const w = 36;
        const h = 45;
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return resolve(null);
        // 카드처럼 가운데를 채워 자른다(object-fit: cover).
        const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
        const dw = img.naturalWidth * scale;
        const dh = img.naturalHeight * scale;
        ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
        const { data } = ctx.getImageData(0, 0, w, h);
        const band = (from: number, to: number) => {
          let sum = 0;
          let n = 0;
          for (let y = Math.floor(h * from); y < Math.ceil(h * to); y++) {
            for (let x = 0; x < w; x++) {
              const i = (y * w + x) * 4;
              // 사람 눈 기준 밝기(sRGB 가중치). 정확한 선형 변환까지는 필요 없다.
              sum += (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
              n++;
            }
          }
          return n ? sum / n : 0.5;
        };
        resolve({ top: band(0.15, 0.45), middle: band(0.35, 0.7), bottom: band(0.55, 0.9) });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  }).then((tone) => {
    cache.set(url, tone);
    pending.delete(url);
    return tone;
  });
  pending.set(url, job);
  return job;
}

/**
 * 사진의 밝기. 재는 동안과 사진이 없을 때는 null 이다(그동안은 어두운 사진으로
 * 보고 그린다 — 사진이 없으면 어두운 그라데이션이 깔리기 때문이다).
 */
export function usePhotoTone(url: string | null | undefined): PhotoTone | null {
  const [, force] = useState(0);
  const tone = url ? cache.get(url) : undefined;

  useEffect(() => {
    if (!url || cache.has(url)) return;
    let alive = true;
    void measure(url).then(() => alive && force((n) => n + 1));
    return () => {
      alive = false;
    };
  }, [url]);

  return tone ?? null;
}

/** 여러 사진의 밝기를 한꺼번에. 순서는 받은 주소 순서. 재는 동안은 null. */
export function usePhotoTones(urls: (string | null | undefined)[]): (PhotoTone | null)[] {
  const [, force] = useState(0);
  const key = urls.join("\n");

  useEffect(() => {
    let alive = true;
    const todo = key.split("\n").filter((u) => u && !cache.has(u));
    if (!todo.length) return;
    void Promise.all(todo.map(measure)).then(() => alive && force((n) => n + 1));
    return () => {
      alive = false;
    };
  }, [key]);

  return urls.map((u) => (u ? (cache.get(u) ?? null) : null));
}
