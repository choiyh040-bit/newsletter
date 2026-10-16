"use client";

import { getFontEmbedCSS, toBlob } from "html-to-image";
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
  const blob = await toBlob(node, {
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
