"use client";

import { getFontEmbedCSS, toBlob } from "html-to-image";
import JSZip from "jszip";
import { CARD_HEIGHT, CARD_WIDTH } from "./cardnews";

/**
 * 카드 DOM을 PNG로 굽는다.
 *
 * 화면에 보이는 것과 같은 노드를 그대로 캡처하므로 미리보기와 결과물이
 * 어긋나지 않는다. 캡처 전에 웹폰트가 실제로 로드됐는지 기다리지 않으면
 * 대체 글꼴로 찍히기 때문에 document.fonts.ready 를 먼저 기다린다.
 */
async function renderCard(node: HTMLElement, fontEmbedCSS: string): Promise<Blob> {
  const blob = await toBlob(node, {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    pixelRatio: 1,
    cacheBust: false,
    fontEmbedCSS,
  });
  if (!blob) throw new Error("이미지를 만들지 못했습니다.");
  return blob;
}

/**
 * 폰트 임베드 CSS는 파일이 커서(3종 약 2MB) 매번 새로 만들면 느리다.
 * 한 번만 만들어 카드 전체에 돌려쓴다.
 */
async function prepare(nodes: HTMLElement[]): Promise<string> {
  await document.fonts.ready;
  return nodes.length > 0 ? getFontEmbedCSS(nodes[0]) : "";
}

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
  const fontEmbedCSS = await prepare([node]);
  triggerDownload(await renderCard(node, fontEmbedCSS), filename);
}

/** 카드 전체를 PNG로 구워 ZIP 하나로 내려받는다. */
export async function downloadAllCards(
  nodes: HTMLElement[],
  zipName: string,
  onProgress?: (done: number, total: number) => void
) {
  const fontEmbedCSS = await prepare(nodes);
  const zip = new JSZip();

  for (let i = 0; i < nodes.length; i++) {
    const blob = await renderCard(nodes[i], fontEmbedCSS);
    zip.file(`card-${String(i + 1).padStart(2, "0")}.png`, blob);
    onProgress?.(i + 1, nodes.length);
  }

  triggerDownload(await zip.generateAsync({ type: "blob" }), zipName);
}

/** 파일 이름에 쓸 수 없는 문자를 걸러낸다. */
export function safeFileName(text: string, fallback = "cardnews"): string {
  const cleaned = text.replace(/[\\/:*?"<>|]/g, "").trim().slice(0, 40);
  return cleaned || fallback;
}
