"use client";

import { getFontEmbedCSS, toCanvas } from "html-to-image";
import JSZip from "jszip";
import { CARD_HEIGHT, CARD_WIDTH } from "./cardnews";

const TRANSPARENT_PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

/**
 * 카드 DOM을 PNG로 굽는다.
 *
 * 화면에 보이는 것과 같은 노드를 그대로 캡처하므로 미리보기와 결과물이
 * 어긋나지 않는다. 캡처 전에 웹폰트가 실제로 로드됐는지 기다리지 않으면
 * 대체 글꼴로 찍히기 때문에 document.fonts.ready 를 먼저 기다린다.
 */
async function renderCard(node: HTMLElement, fontEmbedCSS: string): Promise<Blob> {
  const canvas = await toCanvas(node, {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    pixelRatio: 1,
    cacheBust: false,
    // 사진은 모두 /api/photo?… 로 받는다. 기본값(false)이면 html-to-image 가
    // 물음표 뒤를 버리고 캐시해서, 장마다 다른 사진이 첫 장 사진 하나로 구워진다.
    includeQueryParams: true,
    // 사진 하나를 못 받아도(사이트에서 지워진 사진 등) 전체 내보내기가 멈추지
    // 않게 한다. 받기가 실패하면 투명한 1px 로 대신하고(`imagePlaceholder`),
    // 받았는데 그림이 아니면(오류 응답) 그 그림만 건너뛴다(`onImageErrorHandler`).
    // 기본값은 둘 다 내보내기 전체를 실패시킨다. 빈 자리는 템플릿의 대체 배경이 보인다.
    imagePlaceholder: TRANSPARENT_PIXEL,
    onImageErrorHandler: () => undefined,
    fontEmbedCSS,
  });
  try {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("이미지를 만들지 못했습니다.");
    return blob;
  } finally {
    // 다 쓴 캔버스를 바로 비운다. 아이폰 사파리는 캔버스 메모리 한도가 낮고 캔버스를 늦게
    // 치워서, 여러 장을 연달아 그리면 한도를 넘는다(2026-10-17 "다운이 중간에 꺼져").
    canvas.width = 0;
    canvas.height = 0;
  }
}

/** `@font-face` 규칙 하나의 글꼴 이름(소문자)과 굵기. */
function faceOf(rule: string): { family: string; weight: number } | null {
  const family = rule.match(/font-family:\s*["']?([^;"']+)["']?\s*;/i)?.[1]?.trim();
  if (!family) return null;
  const w = rule.match(/font-weight:\s*([^;]+);/i)?.[1]?.trim() ?? "400";
  const weight = w === "bold" ? 700 : w === "normal" ? 400 : Number.parseInt(w, 10) || 400;
  return { family: family.toLowerCase(), weight };
}

/** 노드 안 글자들이 쓰는 글꼴(대체 글꼴까지)과 굵기. */
function usedFaces(node: HTMLElement): Map<string, Set<number>> {
  const used = new Map<string, Set<number>>();
  for (const el of [node, ...node.querySelectorAll<HTMLElement>("*")]) {
    if (!el.textContent?.trim()) continue;
    const style = getComputedStyle(el);
    const weight = Number.parseInt(style.fontWeight, 10) || 400;
    for (const name of style.fontFamily.split(",")) {
      const family = name.trim().replace(/^["']|["']$/g, "").toLowerCase();
      if (!family) continue;
      if (!used.has(family)) used.set(family, new Set());
      used.get(family)!.add(weight);
    }
  }
  return used;
}

/**
 * 원하는 굵기에 브라우저가 실제로 고르는 굵기(CSS 글꼴 굵기 맞추기 규칙).
 * 400~500 은 위로 500 까지 → 아래 → 그 위, 400 미만은 아래 → 위, 500 초과는 위 → 아래.
 */
function pickWeight(want: number, have: number[]): number {
  if (have.includes(want)) return want;
  const up = have.filter((w) => w > want).sort((a, b) => a - b);
  const down = have.filter((w) => w < want).sort((a, b) => b - a);
  if (want >= 400 && want <= 500) {
    const toFive = up.filter((w) => w <= 500);
    return toFive[0] ?? down[0] ?? up[0];
  }
  return want < 400 ? (down[0] ?? up[0]) : (up[0] ?? down[0]);
}

/**
 * 한 장에 넣을 글꼴 CSS. **그 장에 실제로 쓰인 글꼴·굵기만** 남긴다.
 *
 * 글꼴은 파일을 통째로 글자 데이터(base64)로 넣어야 PNG 에 찍힌다. 카드 글꼴은 합쳐
 * 4MB 가 넘는다. 2026-10-16 판은 사진 · 자막의 장마다 다른 서체를 살리려고 **모든 장의
 * 글꼴을 모아 장마다** 넣었는데, 그러자 장마다 4~6MB 짜리 그림 데이터가 생겨 휴대폰에서
 * 내보내기 중에 탭이 꺼졌다(2026-10-17). 장마다 자기 글꼴만 넣으면 서체도 살고 크기도 준다.
 *
 * html-to-image 의 `getFontEmbedCSS` 는 글꼴 이름으로만 거르고 굵기는 다 넣는다(원티드
 * 산스 세 굵기가 각 0.9MB). 그래서 쓰는 굵기마다 브라우저가 고를 굵기(`pickWeight`)만 남긴다.
 */
async function fontCSSFor(node: HTMLElement): Promise<string> {
  const used = usedFaces(node);
  const rules = (await getFontEmbedCSS(node))
    .split(/(?=@font-face)/)
    .map((r) => r.trim())
    .filter(Boolean);
  const faces = rules.map(faceOf);
  const keep = new Map<string, Set<number>>();
  for (const [family, weights] of used) {
    const have = [...new Set(faces.filter((f) => f?.family === family).map((f) => f!.weight))];
    if (!have.length) continue;
    keep.set(family, new Set([...weights].map((w) => pickWeight(w, have))));
  }
  return rules
    .filter((_, i) => {
      const f = faces[i];
      // 굵기를 범위로 적은 글꼴(가변 글꼴, 예: "100 900")은 이름만 맞으면 넣는다.
      if (!f) return true;
      return keep.get(f.family)?.has(f.weight) ?? false;
    })
    .join("\n");
}

/** 장 사이에 숨 돌릴 틈. 휴대폰 브라우저가 앞 장의 메모리를 치울 시간을 준다. */
const breathe = () => new Promise((resolve) => setTimeout(resolve, 60));

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;

  // 링크를 문서에 붙이지 않으면 download 속성이 무시돼 파일 이름이 사라진다.
  // 해제도 클릭 직후에 하면 브라우저가 blob을 읽기 전에 없어질 수 있어 미룬다.
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** 카드 한 장을 PNG로 내려받는다. */
export async function downloadCard(node: HTMLElement, filename: string) {
  await document.fonts.ready;
  triggerDownload(await renderCard(node, await fontCSSFor(node)), filename);
}

/** 카드 전체를 PNG로 구워 ZIP 하나로 내려받는다. 장마다 그 장의 글꼴만 넣어 한 장씩 굽는다. */
export async function downloadAllCards(
  nodes: HTMLElement[],
  zipName: string,
  onProgress?: (done: number, total: number) => void
) {
  await document.fonts.ready;
  const zip = new JSZip();

  for (let i = 0; i < nodes.length; i++) {
    const blob = await renderCard(nodes[i], await fontCSSFor(nodes[i]));
    zip.file(`card-${String(i + 1).padStart(2, "0")}.png`, blob);
    onProgress?.(i + 1, nodes.length);
    await breathe();
  }

  triggerDownload(await zip.generateAsync({ type: "blob" }), zipName);
}

function toDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * 카드를 PNG 그림(data URL)으로 만든다. 파일로 내려받지 않는다. 앱 안 브라우저처럼 내려받기가
 * 막힌 곳에서 화면에 펼쳐 보여 주고 길게 눌러 저장하게 할 때 쓴다(`lib/inApp.ts`).
 * blob: 주소가 아니라 data: 주소인 이유: 앱이 "이미지 저장"을 할 때 주소를 앱이 직접 다시 읽는데,
 * blob: 주소는 웹 화면 밖에서는 읽을 수 없다.
 */
export async function renderCardImages(
  nodes: HTMLElement[],
  onProgress?: (done: number, total: number) => void
): Promise<string[]> {
  await document.fonts.ready;
  const images: string[] = [];
  for (let i = 0; i < nodes.length; i++) {
    images.push(await toDataURL(await renderCard(nodes[i], await fontCSSFor(nodes[i]))));
    onProgress?.(i + 1, nodes.length);
    await breathe();
  }
  return images;
}

/** 파일 이름에 쓸 수 없는 문자를 걸러낸다. */
export function safeFileName(text: string, fallback = "cardnews"): string {
  const cleaned = text.replace(/[\\/:*?"<>|]/g, "").trim().slice(0, 40);
  return cleaned || fallback;
}
