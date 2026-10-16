"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CAPTION_LOOK_IDS,
  CARD_HEIGHT,
  CARD_WIDTH,
  MAX_SLIDES,
  photoCredit,
  slidePhoto,
  type CaptionLookId,
  type CardNews,
  type CardSlide,
} from "@/lib/cardnews";
import { toCardJpeg } from "@/lib/photoUpload";
import SlideEditor from "@/components/SlideEditor";
import AccentPicker from "@/components/AccentPicker";
import {
  deleteCardNews,
  setCardNewsTemplate,
  setCardNewsVariant,
  setCardNewsCustomAccent,
  setCardNewsAlign,
  updateCardNewsData,
  useCardNewsHistory,
  useIsHydrated,
} from "@/lib/cardNewsStore";
import {
  BACKGROUND_LABEL,
  availableTemplates,
  templateById,
  resolveColors,
  ALIGN_LABEL,
  DEFAULT_ALIGN,
  type TextAlign,
} from "@/lib/templates";
import { downloadAllCards, downloadCard, safeFileName } from "@/lib/exportCards";
import AdSlot, { AD_SLOTS } from "@/components/AdSlot";
import MobileMenu from "@/components/MobileMenu";
import { assignLooks, CAPTION_LOOKS } from "@/lib/templates/captionLooks";
import { usePhotoTones } from "@/lib/photoTone";

/** 미리보기에서 카드를 줄여 보여줄 비율. 캡처는 항상 원본 크기로 한다. */
const PREVIEW_SCALE = 0.42;

/** 목록이 화면을 다 차지하지 않도록 보여줄 개수를 제한한다. */
const MAX_VISIBLE_HISTORY = 8;

type CopyTarget = "caption" | "hashtags" | "sources";

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

  // 미리보기 배율. 칸 폭에 맞춰 줄인다(최대 PREVIEW_SCALE).
  //
  // 예전에는 0.42 로 고정이었다. 카드가 454px 가 되는데 휴대폰 칸은 340px
  // 남짓이라, 휴대폰에서 **카드 왼쪽이 화면 밖으로 밀려 잘렸다**(오른쪽은 빈
  // 공간). 내려받는 PNG 는 원본 크기라 멀쩡해서, 화면만 보면 카드가 잘린
  // 것처럼 보였다.
  //
  // 칸은 데이터를 불러온 뒤에야 그려지므로, 칸이 붙는 순간부터 잰다(콜백 ref).
  const [previewScale, setPreviewScale] = useState(PREVIEW_SCALE);
  const previewObserver = useRef<ResizeObserver | null>(null);
  const previewBoxRef = useCallback((el: HTMLDivElement | null) => {
    previewObserver.current?.disconnect();
    if (!el) return;
    const fit = () => setPreviewScale(Math.min(PREVIEW_SCALE, el.clientWidth / CARD_WIDTH));
    fit();
    previewObserver.current = new ResizeObserver(fit);
    previewObserver.current.observe(el);
  }, []);
  // 사진 파이프라인이 아직 없어 색 배경 템플릿만 고를 수 있다.
  const choices = availableTemplates();
  const template = templateById(entry?.templateId);
  // 색 조합에 직접 고른 강조색을 덮은 실제 색.
  const variant = resolveColors(
    template,
    entry?.variantId,
    entry?.customAccents?.[template.id]
  );
  const align: TextAlign = entry?.align ?? DEFAULT_ALIGN;
  const Render = template.Render;

  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState<CopyTarget | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  // 캡처 대상은 화면 밖에 원본 크기로 그려둔 카드들이다.
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const total = data?.slides.length ?? 0;
  const entryId = entry?.id ?? "";
  const current = slidePos.id === entryId ? slidePos.index : 0;

  // ─── 사진(사진 템플릿) ─────────────────────────────────────────────────────
  // 장마다 다른 사진을 쓴다. 이 장에 올린 사진 → 이 장 사진 → 세트 사진 순.
  const isPhotoTemplate = template.background === "photo";
  const photoOf = (i: number) =>
    isPhotoTemplate && data?.slides[i] ? slidePhoto(data.slides[i], data) : null;
  const photo = photoOf(current);

  // 사진 · 자막: 세트 전체의 사진 밝기를 재서 장마다 글씨 모양을 정한다. 이웃한
  // 장이 같은 모양이 되지 않게 여기서 한꺼번에 정해 카드에 넘긴다(저장은 안 한다.
  // 사람이 고른 모양만 저장된다).
  const tones = usePhotoTones(
    template.id === "photo-caption" && data ? data.slides.map((sl) => slidePhoto(sl, data)?.url) : []
  );
  const isCaption = template.id === "photo-caption";
  const looks = useMemo(
    () =>
      isCaption && data
        ? assignLooks(
            data.slides.map((sl) => ({ slideNumber: sl.slideNumber, isCover: sl.kind === "cover", chosen: sl.captionLook })),
            tones
          )
        : [],
    [isCaption, data, tones]
  );
  const renderSlide = (i: number): CardSlide =>
    looks[i] && data ? { ...data.slides[i], captionLook: looks[i] } : data!.slides[i];

  // 캡션 끝 사진 표기. 장마다 사진이 달라서 쓴 사진을 모두 적는다(같은 사진은 한 번).
  // 픽사베이·언스플래쉬는 곳마다 작가를 모아 한 줄, 위키미디어(CC)는 사진마다
  // 라이선스와 원본 주소까지 한 줄. 사진 템플릿이 아니면 붙이지 않는다. 템플릿을
  // 바꾸면 따라 바뀌어야 해서 저장된 캡션에 넣지 않고 보여 줄 때·복사할 때 만든다.
  const creditLines = (() => {
    if (!isPhotoTemplate || !data) return [] as string[];
    const seen = new Set<string>();
    const photos = data.slides
      .map((sl) => slidePhoto(sl, data))
      .filter((p): p is NonNullable<typeof p> => !!p && !!photoCredit(p) && !seen.has(p.url) && !!seen.add(p.url));
    const lines: string[] = [];
    for (const src of ["Pixabay", "Unsplash"] as const) {
      const names = [...new Set(photos.filter((p) => p.source === src).map((p) => p.credit))];
      if (names.length) lines.push(`사진: ${names.join(", ")} · ${src}`);
    }
    for (const p of photos.filter((p) => p.source !== "Pixabay" && p.source !== "Unsplash")) {
      lines.push(`사진: ${photoCredit(p)}${p.pageUrl ? ` ${p.pageUrl}` : ""}`);
    }
    return lines;
  })();
  const captionText = (data?.caption ?? "") + (creditLines.length ? `\n${creditLines.join("\n")}` : "");

  /** 지금 보는 장의 사진 칸을 바꿔 저장한다. */
  const updateSlide = (patch: (slide: CardSlide) => CardSlide) => {
    if (!entry || !data) return;
    updateCardNewsData(entry.id, {
      ...data,
      slides: data.slides.map((sl, i) => (i === current ? patch(sl) : sl)),
    });
  };

  // 내 사진 올리기(지금 보는 장). 아이스탁처럼 프로그램이 가져올 수 없는 곳의 사진.
  const [uploadError, setUploadError] = useState<string | null>(null);
  const uploadPhoto = async (file: File | undefined) => {
    if (!file || !data) return;
    setUploadError(null);
    try {
      const url = await toCardJpeg(file);
      updateSlide((sl) => ({
        ...sl,
        userPhoto: { url, credit: "직접 올린 사진", license: "사용자 제공", pageUrl: "", source: "upload" },
      }));
    } catch {
      setUploadError("사진을 읽지 못했습니다. JPG·PNG 사진인지 확인해 주세요.");
    }
  };

  // 다른 사진(지금 보는 장). 같은 검색어로, 다른 장에 쓴 사진·이미 본 사진은 빼고 찾는다.
  const [photoBusy, setPhotoBusy] = useState(false);
  const nextPhoto = async () => {
    if (!data || photoBusy) return;
    const slide = data.slides[current];
    setUploadError(null);
    setPhotoBusy(true);
    try {
      // 예전 결과에는 검색어가 남아 있지 않다. 그때는 일반적인 행사장 컷을 찾는다.
      const query = slide.photoQuery || data.photoQuery || "convention center";
      const inUse = data.slides.map((sl) => slidePhoto(sl, data)?.pageUrl ?? "");
      const exclude = [...new Set([...(data.photoSeen ?? []), ...inUse])].filter(Boolean);
      const res = await fetch("/api/photo-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, exclude }),
      });
      const body = (await res.json().catch(() => ({}))) as { photo?: CardNews["photo"] | null };
      if (!res.ok || !body.photo) {
        setUploadError("더 보여 드릴 사진을 찾지 못했습니다.");
        return;
      }
      if (!entry) return;
      updateCardNewsData(entry.id, {
        ...data,
        photoSeen: exclude.slice(-30),
        slides: data.slides.map((sl, i) => (i === current ? { ...sl, photo: body.photo! } : sl)),
      });
    } catch {
      setUploadError("사진을 찾지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setPhotoBusy(false);
    }
  };

  // 올린 사진 지우기(지금 보는 장). 예전 판의 세트 단위 올린 사진도 함께 지운다.
  const currentHasUpload = !!(data?.slides[current]?.userPhoto || (!data?.slides[current]?.photo && data?.userPhoto));
  const removeUserPhoto = () => {
    if (!entry || !data) return;
    const { userPhoto: _setUpload, ...rest } = data;
    void _setUpload;
    const slides = data.slides.map((sl, i) => {
      if (i !== current) return sl;
      const { userPhoto: _u, ...plain } = sl;
      void _u;
      return plain;
    });
    updateCardNewsData(entry.id, { ...(data.slides[current]?.userPhoto ? data : rest), slides });
  };

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

  // 출처 목록. 예전 결과에는 `sources` 가 없으므로 `source` 하나로 대신한다.
  const sourceList =
    data?.sources && data.sources.length > 0 ? data.sources : data?.source ? [data.source] : [];

  const copy = async (target: CopyTarget) => {
    if (!data) return;
    const text =
      target === "caption"
        ? captionText
        : target === "sources"
          ? sourceList.map((s) => `출처: ${s.name} ${s.url}`.trim()).join("\n")
          : data.hashtags.map((tag) => `#${tag}`).join(" ");
    await navigator.clipboard.writeText(text);
    setCopied(target);
    setTimeout(() => setCopied(null), 2000);
  };

  // 날짜를 앞에 붙여 내려받은 파일이 만든 순서대로 정렬되게 한다.
  const datePrefix = (entry?.createdAt ?? new Date().toISOString()).slice(0, 10);
  const baseName = `${datePrefix}-${safeFileName(entry?.keyword || data?.title || "cardnews")}`;

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

  const saveEdit = (next: CardNews) => {
    if (entry) updateCardNewsData(entry.id, next);
  };

  /** 지금 장 바로 뒤에 빈 장을 끼운다. 사람이 채우라고 안내 문구만 넣어 둔다. */
  const addSlide = () => {
    if (!data || !entry || data.slides.length >= MAX_SLIDES) return;
    const blank: CardSlide = {
      slideNumber: 0, // normalizeCardNews 가 다시 매긴다
      kind: "detail",
      badge: data.slides[current]?.badge ?? "뉴스",
      sub: "",
      heading: [[{ text: "새 장 헤드라인", style: "plain" }]],
      body: [],
      note: [],
    };
    const slides = [...data.slides];
    slides.splice(current + 1, 0, blank);
    saveEdit({ ...data, slides });
    goTo(() => current + 1);
  };

  const deleteSlide = () => {
    if (!data || !entry || data.slides.length <= 2) return;
    const slides = data.slides.filter((_, i) => i !== current);
    saveEdit({ ...data, slides });
    goTo(() => Math.max(0, current - 1));
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
              slide={renderSlide(i)}
              accent={data.accent}
              total={total}
              source={data.source}
              photo={photoOf(i)}
              variant={variant}
              align={align}
            />
          </div>
        ))}
      </div>

      <header className="bg-surface/80 backdrop-blur-xl border-b border-white/8 fixed top-0 w-full z-50">
        <div className="flex justify-between items-center gap-2 px-4 md:px-12 h-16 w-full max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-2 md:gap-2.5 hover:opacity-80 transition-opacity whitespace-nowrap">
            <div className="w-7 h-7 rounded-lg cta-gradient flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                auto_awesome
              </span>
            </div>
            <span className="font-korean-bold text-white text-base">CardGen AI</span>
          </Link>
          <div className="flex items-center gap-1.5">
            <MobileMenu />
            <button
              onClick={() => router.push("/")}
              className="cta-gradient text-white font-korean-bold px-5 py-2 rounded-full text-sm active:scale-95 transition-transform whitespace-nowrap"
            >
              새로 만들기
            </button>
          </div>
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
          <div ref={previewBoxRef} className="lg:col-span-7 min-w-0 flex flex-col items-center">
            <div
              className="relative rounded-2xl overflow-hidden shadow-2xl"
              style={{
                width: CARD_WIDTH * previewScale,
                height: CARD_HEIGHT * previewScale,
              }}
            >
              <div
                style={{
                  transform: `scale(${previewScale})`,
                  transformOrigin: "top left",
                  width: CARD_WIDTH,
                  height: CARD_HEIGHT,
                }}
              >
                <Render
                  slide={renderSlide(current)}
                  accent={data.accent}
                  total={total}
                  source={data.source}
                  photo={photo}
              variant={variant}
              align={align}
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
            {/* 고치기. 모델이 쓴 문장을 그대로 올릴 일은 거의 없으므로
                미리보기 옆에 둔다. 고치는 즉시 왼쪽 카드에 반영된다. */}
            <button
              onClick={() => setEditing((v) => !v)}
              className={`w-full py-3 rounded-2xl border text-sm font-korean-bold transition-colors ${
                editing
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-white/10 text-white/80 hover:bg-white/5"
              }`}
            >
              {editing ? "고치기 닫기" : "내용 고치기"}
            </button>

            {editing && data && entry && (
              <SlideEditor
                // 장이 바뀌면 편집기를 새로 단다. 줄 수 경고 같은 상태가
                // 앞 장의 것을 물고 넘어오지 않게 한다.
                key={current}
                data={data}
                index={current}
                onChange={saveEdit}
                onAddSlide={addSlide}
                onDeleteSlide={deleteSlide}
              />
            )}

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
              {/* 강조색. 색을 가진 템플릿에서만 나온다. */}
              {template.variants && template.variants.length > 0 && entry && (
                <div className="mt-5 pt-4 border-t border-white/5">
                  <AccentPicker
                    template={template}
                    current={variant}
                    onPreset={(variantId) => setCardNewsVariant(entry.id, template.id, variantId)}
                    onCustom={(color) => setCardNewsCustomAccent(entry.id, template.id, color)}
                  />
                </div>
              )}

              {/* 정렬. 이걸 고를 수 있는 템플릿에서만 나온다. */}
              {template.alignable && (
                <div className="mt-5 pt-4 border-t border-white/5">
                  <div className="flex items-baseline justify-between mb-3">
                    <span className="text-white/70 text-xs font-korean-bold">정렬</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(["left", "center"] as const).map((option) => {
                      const isCurrent = option === align;
                      return (
                        <button
                          key={option}
                          onClick={() => entry && setCardNewsAlign(entry.id, option)}
                          className={`py-2 rounded-xl border text-sm transition-colors ${
                            isCurrent
                              ? "border-primary/50 bg-primary/10 text-primary font-korean-bold"
                              : "border-white/10 text-white/70 hover:bg-white/5"
                          }`}
                        >
                          {ALIGN_LABEL[option]}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-white/30 text-xs mt-2 font-korean-reg">
                    본문이 길면 좌측이 읽기 좋습니다. 중앙은 짧고 단정적인 세트에 어울립니다.
                  </p>
                </div>
              )}

              {/* 사진 · 자막: 장마다 글씨 모양. 기본은 사진 밝기를 보고 자동. */}
              {template.id === "photo-caption" && data.slides[current] && (
                <div className="mt-5 pt-4 border-t border-white/5">
                  <label className="block text-white/70 text-xs font-korean-bold mb-2" htmlFor="caption-look">
                    글씨 모양 · {current + 1}번째 장
                  </label>
                  <div className="flex gap-2">
                    <select
                      id="caption-look"
                      value={data.slides[current].captionLook ?? ""}
                      onChange={(e) => {
                        const value = e.target.value as CaptionLookId | "";
                        updateSlide((sl) => {
                          const { captionLook: _old, ...rest } = sl;
                          void _old;
                          return value ? { ...rest, captionLook: value } : rest;
                        });
                      }}
                      className="flex-1 min-w-0 bg-white/5 border border-white/15 rounded-lg text-white/85 text-sm py-2 px-3"
                    >
                      <option value="">자동</option>
                      {CAPTION_LOOK_IDS.map((id) => (
                        <option key={id} value={id}>
                          {CAPTION_LOOKS[id].name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        if (!entry) return;
                        const value = data.slides[current].captionLook;
                        updateCardNewsData(entry.id, {
                          ...data,
                          slides: data.slides.map((sl) => {
                            const { captionLook: _old, ...rest } = sl;
                            void _old;
                            return value ? { ...rest, captionLook: value } : rest;
                          }),
                        });
                      }}
                      className="py-2 px-3 rounded-lg border border-white/15 text-white/80 text-sm font-korean-reg hover:bg-white/5 whitespace-nowrap"
                    >
                      모든 장에 적용
                    </button>
                  </div>
                  <p className="text-white/30 text-xs mt-2 font-korean-reg leading-relaxed">
                    자동이면 장마다 사진에서 잘 읽히는 모양을 골라 돌아가며 씁니다. 밝은 사진에서는 외곽선·색 글씨가
                    안 보여 고르지 않습니다.
                  </p>
                </div>
              )}

              {/* 사진 템플릿: 쓴 사진의 출처, 그리고 내 사진 올리기 */}
              {template.background === "photo" && (
                <div className="mt-5 pt-4 border-t border-white/5">
                  <span className="block text-white/70 text-xs font-korean-bold mb-2">사진</span>
                  <p className="text-white/50 text-xs font-korean-reg mb-1">
                    {current + 1}번째 장의 사진입니다. 장마다 따로 바꿀 수 있습니다.
                  </p>
                  <p className="text-white/40 text-xs font-korean-reg leading-relaxed [overflow-wrap:anywhere]">
                    {photo?.source === "upload" ? (
                      "직접 올린 사진을 쓰고 있습니다. 사진 표기는 붙이지 않습니다."
                    ) : photo ? (
                      <>
                        사진: {photoCredit(photo)}{" "}
                        <a href={photo.pageUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          원본 보기
                        </a>
                        <br />
                        상업적 사용이 허용된 라이선스의 사진입니다. 작가 표기는 카드와 캡션에 자동으로 들어갑니다.
                      </>
                    ) : (
                      "이 기사에 맞는 저작권 안전한 사진을 찾지 못해 그라데이션으로 그렸습니다."
                    )}
                  </p>
                  <div className="flex gap-2 mt-3">
                    {/* 올린 사진을 쓰는 중이면 자동 사진이 안 보이므로 숨긴다. */}
                    {!currentHasUpload && (
                      <button
                        type="button"
                        onClick={() => void nextPhoto()}
                        disabled={photoBusy}
                        className="flex-1 py-2 rounded-lg border border-white/15 text-white/80 text-sm font-korean-reg hover:bg-white/5 disabled:opacity-50"
                      >
                        {photoBusy ? "찾는 중…" : "다른 사진"}
                      </button>
                    )}
                    <label className="flex-1 text-center py-2 rounded-lg border border-white/15 text-white/80 text-sm font-korean-reg cursor-pointer hover:bg-white/5">
                      내 사진 올리기
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          void uploadPhoto(e.target.files?.[0]);
                          e.target.value = "";
                        }}
                      />
                    </label>
                    {currentHasUpload && (
                      <button
                        type="button"
                        onClick={removeUserPhoto}
                        className="flex-1 py-2 rounded-lg border border-white/10 text-white/50 text-sm font-korean-reg hover:bg-white/5"
                      >
                        올린 사진 지우기
                      </button>
                    )}
                  </div>
                  <p className="text-white/30 text-xs mt-2 font-korean-reg leading-relaxed">
                    아이스탁 등에서 직접 받은 사진을 쓸 때. 사용 권한은 올리는 분이 확인해 주세요.
                  </p>
                  {uploadError && <p className="text-red-400 text-xs mt-2 font-korean-reg">{uploadError}</p>}
                </div>
              )}
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
              <p className="text-white/80 text-sm leading-relaxed whitespace-pre-line [overflow-wrap:anywhere]">{captionText}</p>

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

            {sourceList.length > 0 && (
              <div className="glass-panel p-5 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-white font-korean-bold text-sm">출처</h4>
                  {sourceList.some((src) => src.url) && (
                    <button
                      onClick={() => copy("sources")}
                      className="text-xs transition-colors"
                      style={{ color: copied === "sources" ? "#4cd7f6" : "rgba(255,255,255,0.4)" }}
                    >
                      {copied === "sources" ? "복사됨!" : "복사"}
                    </button>
                  )}
                </div>
                {/* 주소를 글자로 다 보여 준다. 게시글에 붙이려면 주소 자체가 필요하다. */}
                <ul className="space-y-3">
                  {sourceList.map((src) => (
                    <li key={src.url || src.name}>
                      <p className="text-white/80 text-sm">{src.name}</p>
                      {src.url ? (
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary text-xs break-all hover:underline"
                        >
                          {src.url}
                        </a>
                      ) : (
                        <p className="text-white/40 text-xs font-korean-reg">
                          출처 주소를 찾지 못했습니다. 매체명으로 검색해 확인하세요.
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
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

        {/* 결과 화면 맨 아래 광고 칸. 버튼들과 떨어진 자리. 애드센스 번호가 없으면 그리지 않는다. */}
        <AdSlot slot={AD_SLOTS.result} height={120} className="mt-14" />
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
