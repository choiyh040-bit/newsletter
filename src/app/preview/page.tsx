"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CARD_HEIGHT, CARD_WIDTH } from "@/lib/cardnews";
import {
  deleteCardNews,
  setCardNewsTemplate,
  setCardNewsVariant,
  useCardNewsHistory,
  useIsHydrated,
} from "@/lib/cardNewsStore";
import {
  BACKGROUND_LABEL,
  availableTemplates,
  templateById,
  variantFor,
} from "@/lib/templates";
import { downloadAllCards, downloadCard, safeFileName } from "@/lib/exportCards";

/** 미리보기에서 카드를 줄여 보여줄 비율. 캡처는 항상 원본 크기로 한다. */
const PREVIEW_SCALE = 0.42;

/** 목록이 화면을 다 차지하지 않도록 보여줄 개수를 제한한다. */
const MAX_VISIBLE_HISTORY = 8;

type CopyTarget = "caption" | "hashtags";

/** 오늘 만든 것인지 한눈에 보이게 짧게 적는다. */
function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const today = new Date().toDateString() === date.toDateString();
  const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  return today ? `오늘 ${time}` : `${date.getMonth() + 1}월 ${date.getDate()}일 ${time}`;
}

function PreviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const history = useCardNewsHistory();
  const loaded = useIsHydrated();

  // 주소에 id 가 있으면 그 결과를, 없으면 가장 최근 것을 연다.
  const id = searchParams.get("id");
  const entry = id ? history.find((e) => e.id === id) : history[0];
  const data = entry?.data ?? null;

  // 보고 있는 장을 결과 id와 함께 들고 있는다. 다른 결과로 옮겼을 때 첫 장으로
  // 되돌리는 일을 효과로 처리하면 렌더가 한 번 더 도는데, 렌더 시점에 id를
  // 비교하면 그럴 필요가 없다.
  const [slidePos, setSlidePos] = useState({ id: "", index: 0 });
  // 사진 파이프라인이 아직 없어 색 배경 템플릿만 고를 수 있다.
  const choices = availableTemplates(false);
  const template = templateById(entry?.templateId);
  const variant = variantFor(template, entry?.variantId);
  const Render = template.Render;

  const [copied, setCopied] = useState<CopyTarget | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  // 캡처 대상은 화면 밖에 원본 크기로 그려둔 카드들이다.
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const total = data?.slides.length ?? 0;
  const entryId = entry?.id ?? "";
  const current = slidePos.id === entryId ? slidePos.index : 0;

  const goTo = useCallback(
    (move: (index: number) => number) => {
      setSlidePos((prev) => ({
        id: entryId,
        index: move(prev.id === entryId ? prev.index : 0),
      }));
    },
    [entryId]
  );

  const next = useCallback(() => goTo((i) => (i + 1) % total), [goTo, total]);
  const prev = useCallback(() => goTo((i) => (i - 1 + total) % total), [goTo, total]);

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
  const datePrefix = (entry?.createdAt ?? new Date().toISOString()).slice(0, 10);
  const baseName = `${datePrefix}-${safeFileName(entry?.keyword ?? data?.title ?? "cardnews")}`;

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

  /** 지금 보고 있는 것을 지우면 남은 것 중 최신으로 옮긴다. */
  const handleDelete = (targetId: string, isCurrent: boolean) => {
    const remaining = history.filter((item) => item.id !== targetId);
    deleteCardNews(targetId);
    if (isCurrent) {
      router.replace(remaining[0] ? `/preview?id=${remaining[0].id}` : "/preview");
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
            <Render
              slide={slide}
              accent={data.accent}
              total={total}
              source={data.source}
              photo={null}
              variant={variant}
            />
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
                <Render
                  slide={data.slides[current]}
                  accent={data.accent}
                  total={total}
                  source={data.source}
                  photo={null}
              variant={variant}
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
              <h4 className="text-white font-korean-bold text-sm mb-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm">palette</span>
                디자인
              </h4>
              <p className="text-white/40 text-xs mb-4 font-korean-reg">
                같은 기사로 바로 바꿔볼 수 있습니다. 다시 생성하지 않습니다.
              </p>
              <div className="space-y-2">
                {choices.map((choice) => {
                  const isCurrent = choice.id === template.id;
                  return (
                    <button
                      key={choice.id}
                      onClick={() => entry && setCardNewsTemplate(entry.id, choice.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                        isCurrent
                          ? "border-primary/50 bg-primary/10"
                          : "border-white/10 hover:bg-white/5"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={`text-sm ${
                            isCurrent ? "text-primary font-korean-bold" : "text-white/80"
                          }`}
                        >
                          {choice.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/50">
                          {BACKGROUND_LABEL[choice.background]}
                        </span>
                      </span>
                      <span className="block text-white/40 text-xs mt-1">{choice.description}</span>
                    </button>
                  );
                })}
              </div>
              {/* 색 조합. 색을 가진 템플릿에서만 나온다. */}
              {template.variants && template.variants.length > 0 && (
                <div className="mt-5 pt-4 border-t border-white/5">
                  <div className="flex items-baseline justify-between mb-3">
                    <span className="text-white/70 text-xs font-korean-bold">색 조합</span>
                    <span className="text-white/40 text-xs">{variant?.name}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {template.variants.map((option) => {
                      const isCurrent = option.id === variant?.id;
                      return (
                        <button
                          key={option.id}
                          onClick={() => entry && setCardNewsVariant(entry.id, option.id)}
                          title={option.name}
                          aria-label={option.name}
                          aria-pressed={isCurrent}
                          className={`w-9 h-9 rounded-full border transition-transform hover:scale-110 ${
                            isCurrent ? "border-white/70 scale-110" : "border-white/15"
                          }`}
                          style={{ background: option.base }}
                        >
                          <span
                            className="block w-3.5 h-3.5 rounded-full mx-auto"
                            style={{ background: option.neon }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <p className="text-white/30 text-xs mt-3 font-korean-reg">
                사진 배경 디자인은 사진 기능이 붙으면 여기에 함께 나옵니다.
              </p>
            </div>

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

            {history.length > 1 && (
              <div className="glass-panel p-5 rounded-2xl">
                <h4 className="text-white font-korean-bold text-sm mb-1">최근 생성</h4>
                <p className="text-white/40 text-xs mb-4 font-korean-reg">
                  이 브라우저에만 저장됩니다. 최대 {MAX_VISIBLE_HISTORY}건까지 보여줍니다.
                </p>
                <ul className="space-y-1">
                  {history.slice(0, MAX_VISIBLE_HISTORY).map((item) => {
                    const isCurrent = item.id === entry?.id;
                    return (
                      <li key={item.id} className="flex items-center gap-1">
                        <button
                          onClick={() => router.replace(`/preview?id=${item.id}`)}
                          className={`flex-1 text-left px-3 py-2 rounded-lg transition-colors min-w-0 ${
                            isCurrent ? "bg-white/10" : "hover:bg-white/5"
                          }`}
                        >
                          <span
                            className={`block text-sm truncate ${
                              isCurrent ? "text-primary font-korean-bold" : "text-white/70"
                            }`}
                          >
                            {item.keyword || item.data.title}
                          </span>
                          <span className="block text-white/35 text-xs mt-0.5">
                            {formatWhen(item.createdAt)} · {item.data.slides.length}장
                          </span>
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, isCurrent)}
                          aria-label="이 결과 삭제"
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white/25 hover:text-red-400 hover:bg-white/5 transition-colors flex-shrink-0"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

export default function PreviewPage() {
  // useSearchParams 를 쓰는 화면은 Suspense 경계 안에 있어야 한다. 이 경로는
  // 미리 렌더되므로, 경계가 없으면 프로덕션 빌드가 실패한다.
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-white/60 font-korean-reg">
          불러오는 중...
        </div>
      }
    >
      <PreviewContent />
    </Suspense>
  );
}
