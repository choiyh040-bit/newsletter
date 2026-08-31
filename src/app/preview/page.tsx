"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CardNewsCard from "@/components/CardNewsCard";
import { CARD_HEIGHT, CARD_WIDTH } from "@/lib/cardnews";
import { downloadAllCards, downloadCard, safeFileName } from "@/lib/exportCards";
import { useIsHydrated, useStoredCardNews } from "@/lib/useStoredCardNews";

/** 미리보기에서 카드를 줄여 보여줄 비율. 캡처는 항상 원본 크기로 한다. */
const PREVIEW_SCALE = 0.42;

type CopyTarget = "caption" | "hashtags";

export default function PreviewPage() {
  const router = useRouter();
  const { data, meta } = useStoredCardNews();
  const loaded = useIsHydrated();
  const [current, setCurrent] = useState(0);
  const [copied, setCopied] = useState<CopyTarget | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  // 캡처 대상은 화면 밖에 원본 크기로 그려둔 카드들이다.
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const total = data?.slides.length ?? 0;
  const next = useCallback(() => setCurrent((i) => (i + 1) % total), [total]);
  const prev = useCallback(() => setCurrent((i) => (i - 1 + total) % total), [total]);

  useEffect(() => {
    if (total === 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, total]);

  const copy = async (target: CopyTarget) => {
    if (!data) return;
    const text =
      target === "caption"
        ? data.caption
        : data.hashtags.map((tag) => `#${tag}`).join(" ");
    await navigator.clipboard.writeText(text);
    setCopied(target);
    setTimeout(() => setCopied(null), 2000);
  };

  // 날짜를 앞에 붙여 내려받은 파일이 만든 순서대로 정렬되게 한다.
  const datePrefix = (meta?.createdAt ?? new Date().toISOString()).slice(0, 10);
  const baseName = `${datePrefix}-${safeFileName(meta?.keyword ?? data?.title ?? "cardnews")}`;

  const saveOne = async () => {
    const node = cardRefs.current[current];
    if (!node) return;
    setExportError(null);
    setExporting("한 장 저장 중...");
    try {
      await downloadCard(node, `${baseName}-${String(current + 1).padStart(2, "0")}.png`);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setExporting(null);
    }
  };

  const saveAll = async () => {
    const nodes = cardRefs.current.filter((n): n is HTMLDivElement => n !== null);
    if (nodes.length === 0) return;
    setExportError(null);
    setExporting(`0 / ${nodes.length} 저장 중...`);
    try {
      await downloadAllCards(nodes, `${baseName}.zip`, (done, count) =>
        setExporting(`${done} / ${count} 저장 중...`)
      );
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setExporting(null);
    }
  };

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white/60 font-korean-reg">
        불러오는 중...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 text-center px-6">
        <div className="w-20 h-20 rounded-2xl glass-panel flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-4xl">article</span>
        </div>
        <h2 className="font-korean-bold text-2xl text-white">생성된 카드뉴스가 없습니다</h2>
        <p className="text-white/50 font-korean-reg max-w-sm">
          홈에서 키워드나 기사 URL을 입력하고 생성하기를 눌러주세요.
        </p>
        <button
          onClick={() => router.push("/")}
          className="cta-gradient text-white px-8 py-3 rounded-xl font-korean-bold hover:scale-105 transition-transform"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <>
      {/* 캡처용 원본 카드. 화면 밖에 두되 display:none 은 쓰지 않는다.
          렌더링이 안 된 노드는 이미지로 구울 수 없기 때문이다. */}
      <div aria-hidden style={{ position: "fixed", left: -99999, top: 0, pointerEvents: "none" }}>
        {data.slides.map((slide, i) => (
          <div
            key={slide.slideNumber}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
          >
            <CardNewsCard slide={slide} accent={data.accent} total={total} source={data.source} />
          </div>
        ))}
      </div>

      <header className="bg-surface/80 backdrop-blur-xl border-b border-white/8 fixed top-0 w-full z-50">
        <div className="flex justify-between items-center px-6 md:px-12 h-16 w-full max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 rounded-lg cta-gradient flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                auto_awesome
              </span>
            </div>
            <span className="font-korean-bold text-white text-base">CardGen AI</span>
          </Link>
          <button
            onClick={() => router.push("/")}
            className="cta-gradient text-white font-korean-bold px-5 py-2 rounded-full text-sm active:scale-95 transition-transform"
          >
            새로 만들기
          </button>
        </div>
      </header>

      <main className="pt-24 pb-20 px-6 md:px-12 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span className="text-green-400 text-xs font-bold">생성 완료</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full glass-panel">
            <span className="text-white/60 text-xs">
              {CARD_WIDTH} × {CARD_HEIGHT} · {total}장
            </span>
          </div>
        </div>
        <h1 className="font-korean-bold text-2xl md:text-3xl text-primary mb-8">{data.title}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* 카드 미리보기 */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div
              className="relative rounded-2xl overflow-hidden shadow-2xl"
              style={{
                width: CARD_WIDTH * PREVIEW_SCALE,
                height: CARD_HEIGHT * PREVIEW_SCALE,
              }}
            >
              <div
                style={{
                  transform: `scale(${PREVIEW_SCALE})`,
                  transformOrigin: "top left",
                  width: CARD_WIDTH,
                  height: CARD_HEIGHT,
                }}
              >
                <CardNewsCard
                  slide={data.slides[current]}
                  accent={data.accent}
                  total={total}
                  source={data.source}
                />
              </div>
            </div>

            <div className="flex items-center gap-4 mt-5">
              <button
                onClick={prev}
                className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 transition-colors"
                aria-label="이전 카드"
              >
                <span className="material-symbols-outlined text-white text-xl">chevron_left</span>
              </button>
              <span className="text-white/60 text-sm font-korean-reg tabular-nums">
                {current + 1} / {total}
              </span>
              <button
                onClick={next}
                className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 transition-colors"
                aria-label="다음 카드"
              >
                <span className="material-symbols-outlined text-white text-xl">chevron_right</span>
              </button>
            </div>
          </div>

          {/* 오른쪽 패널 */}
          <div className="lg:col-span-5 space-y-5">
            <div className="glass-panel p-5 rounded-2xl">
              <h4 className="text-white font-korean-bold text-sm mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm">download</span>
                내보내기
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={saveOne}
                  disabled={exporting !== null}
                  className="py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-colors text-white text-sm font-korean-bold disabled:opacity-40"
                >
                  이 카드 PNG
                </button>
                <button
                  onClick={saveAll}
                  disabled={exporting !== null}
                  className="py-3 rounded-xl cta-gradient text-white text-sm font-korean-bold hover:brightness-110 transition-all disabled:opacity-40"
                >
                  전체 ZIP
                </button>
              </div>
              {exporting && (
                <p className="text-primary text-xs mt-3 font-korean-reg">{exporting}</p>
              )}
              {exportError && (
                <p className="text-red-400 text-xs mt-3 font-korean-reg">{exportError}</p>
              )}
            </div>

            <div className="glass-panel p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-white font-korean-bold text-sm">캡션</h4>
                <button
                  onClick={() => copy("caption")}
                  className="text-xs transition-colors"
                  style={{ color: copied === "caption" ? "#4cd7f6" : "rgba(255,255,255,0.4)" }}
                >
                  {copied === "caption" ? "복사됨!" : "복사"}
                </button>
              </div>
              <p className="text-white/80 text-sm leading-relaxed whitespace-pre-line">{data.caption}</p>

              <div className="border-t border-white/5 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-white font-korean-bold text-sm">해시태그</h4>
                  <button
                    onClick={() => copy("hashtags")}
                    className="text-xs transition-colors"
                    style={{ color: copied === "hashtags" ? "#4cd7f6" : "rgba(255,255,255,0.4)" }}
                  >
                    {copied === "hashtags" ? "복사됨!" : "복사"}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.hashtags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full text-sm border border-white/10 bg-white/5 text-white/70"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {data.source && (
              <div className="glass-panel p-5 rounded-2xl">
                <h4 className="text-white font-korean-bold text-sm mb-2">출처</h4>
                {data.source.url ? (
                  <a
                    href={data.source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-sm break-all hover:underline"
                  >
                    {data.source.name}
                  </a>
                ) : (
                  <p className="text-white/70 text-sm">{data.source.name}</p>
                )}
                <p className="text-white/40 text-xs mt-3 leading-relaxed font-korean-reg">
                  기사 원문을 그대로 옮기지 않고 다시 쓴 내용입니다. 게시 전에 사실 관계를
                  한 번 더 확인하세요.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
