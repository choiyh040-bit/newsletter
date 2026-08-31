"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Slide {
  slideNumber: number;
  imageKeyword?: string;
  heading: string;
  subheading: string;
  body: string;
}

interface InstagramData {
  title: string;
  slides: Slide[];
  caption: string;
  hashtags: string[];
  metrics: {
    attention: number;
    ctr: number;
    dwellTime: number;
    share: number;
    like: number;
    repost: number;
  };
}

type NewsletterData = InstagramData;

interface NewsletterMeta {
  keyword: string;
  theme: string;
}

const METRIC_LIST = [
  { key: "attention" as const, label: "주목도", icon: "visibility" },
  { key: "ctr" as const, label: "클릭률", icon: "ads_click" },
  { key: "dwellTime" as const, label: "체류시간", icon: "timer" },
  { key: "share" as const, label: "공유율", icon: "share" },
  { key: "like" as const, label: "좋아요", icon: "favorite" },
  { key: "repost" as const, label: "저장률", icon: "bookmark" },
];

// ─── EditableText ─────────────────────────────────────────────────────────────
function EditableText({
  value,
  onChange,
  className,
  style,
  tag: Tag = "div",
}: {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  style?: React.CSSProperties;
  tag?: React.ElementType;
}) {
  return (
    <Tag
      contentEditable
      suppressContentEditableWarning
      onBlur={(e: React.FocusEvent<HTMLElement>) => onChange(e.currentTarget.innerText)}
      className={`outline-none hover:bg-black/5 focus:bg-black/5 focus:ring-1 focus:ring-gray-300 rounded transition-colors cursor-text ${className}`}
      style={style}
    >
      {value}
    </Tag>
  );
}

// ─── Instagram Slide Card ─────────────────────────────────────────────────────
function InstagramSlideCard({
  slide,
  total,
  keyword,
  onEdit,
}: {
  slide: Slide;
  total: number;
  keyword: string;
  onEdit?: (slideIdx: number, field: keyof Slide, val: string) => void;
}) {
  const slideIdx = slide.slideNumber - 1;
  const imageKeyword = slide.imageKeyword || keyword || "news";
  const bgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imageKeyword)}?width=800&height=800&nologo=true&seed=${slide.slideNumber * 17}`;

  const today = new Date();
  const dateString = `${today.getMonth() + 1}월 ${today.getDate()}일`;

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden">
      {/* Image */}
      <div className="relative w-full" style={{ height: "52%" }}>
        <img
          src={bgUrl}
          alt={`Slide ${slide.slideNumber}`}
          className="w-full h-full object-cover"
          crossOrigin="anonymous"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${slide.slideNumber}/400/400`;
          }}
        />
        {/* Slide counter badge */}
        <div className="absolute top-3 right-3 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full font-bold backdrop-blur-sm">
          {slide.slideNumber} / {total}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-5 bg-white">
        <span className="text-red-500 font-bold text-[11px] mb-2 block">{dateString}</span>
        <EditableText
          value={slide.heading}
          onChange={(v) => onEdit?.(slideIdx, "heading", v)}
          className="font-bold text-[17px] leading-snug mb-2 text-gray-900"
          tag="h3"
        />
        <EditableText
          value={slide.body}
          onChange={(v) => onEdit?.(slideIdx, "body", v)}
          className="text-gray-500 text-[12px] leading-relaxed flex-1"
          tag="p"
        />
        {/* Bottom bar */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex gap-1">
            {[...Array(total)].map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all ${i === slideIdx ? "w-4 h-1.5 bg-gray-800" : "w-1.5 h-1.5 bg-gray-300"}`}
              />
            ))}
          </div>
          <span className="text-[10px] text-gray-400 font-medium">CardGen AI</span>
        </div>
      </div>
    </div>
  );
}

// ─── Score Ring ───────────────────────────────────────────────────────────────
function ScoreRing({ value, label, icon }: { value: number; label: string; icon: string }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  const color = value >= 85 ? "#4cd7f6" : value >= 70 ? "#06b6d4" : "#0566d9";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-14 h-14">
        <svg className="w-full h-full -rotate-90">
          <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
          <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="4"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1.2s ease" }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="material-symbols-outlined text-[14px]" style={{ color }}>{icon}</span>
        </div>
      </div>
      <span className="text-white font-bold text-xs">{value}</span>
      <span className="text-white/40 text-[10px]">{label}</span>
    </div>
  );
}

// ─── Main Preview Content ─────────────────────────────────────────────────────
function PreviewContent() {
  const router = useRouter();
  const [data, setData] = useState<NewsletterData | null>(null);
  const [meta, setMeta] = useState<NewsletterMeta | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [copied, setCopied] = useState<"caption" | "hashtags" | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("newsletterData");
      const metaRaw = sessionStorage.getItem("newsletterMeta");
      if (raw) setData(JSON.parse(raw));
      if (metaRaw) setMeta(JSON.parse(metaRaw));
    } catch {
      // ignore
    }
  }, []);

  const instagramData = data;

  const totalSlides = instagramData?.slides?.length ?? 0;
  const nextSlide = useCallback(() => setCurrentSlide((s) => (s + 1) % totalSlides), [totalSlides]);
  const prevSlide = useCallback(() => setCurrentSlide((s) => (s - 1 + totalSlides) % totalSlides), [totalSlides]);

  const copyText = async (type: "caption" | "hashtags") => {
    if (!data) return;
    let text = "";
    if (type === "caption") text = data.caption;
    else text = data.hashtags.map((h) => `#${h}`).join(" ");
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleEditSlide = useCallback((slideIdx: number, field: keyof Slide, val: string) => {
    setData((prev) => {
      if (!prev || !("slides" in prev)) return prev;
      const newSlides = [...prev.slides];
      newSlides[slideIdx] = { ...newSlides[slideIdx], [field]: val };
      return { ...prev, slides: newSlides };
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nextSlide, prevSlide]);

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 text-center px-6">
        <div className="w-20 h-20 rounded-2xl glass-panel flex items-center justify-center mb-2">
          <span className="material-symbols-outlined text-primary text-4xl">article</span>
        </div>
        <h2 className="font-korean-bold text-2xl text-white">생성된 콘텐츠가 없습니다</h2>
        <p className="text-white/50 font-korean-reg max-w-sm">
          랜딩 페이지에서 키워드를 입력하고 생성하기 버튼을 눌러주세요.
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
      {/* Fullscreen (Instagram only) */}
      {fullscreen && instagramData && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center"
          onClick={() => setFullscreen(false)}
        >
          <div
            className="relative w-[360px] h-[360px] rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <InstagramSlideCard
              slide={instagramData.slides[currentSlide]}
              total={totalSlides}
              keyword={meta?.keyword || ""}
              onEdit={handleEditSlide}
            />
          </div>
          <button onClick={prevSlide} className="absolute left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full glass-panel flex items-center justify-center">
            <span className="material-symbols-outlined text-white">chevron_left</span>
          </button>
          <button onClick={nextSlide} className="absolute right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full glass-panel flex items-center justify-center">
            <span className="material-symbols-outlined text-white">chevron_right</span>
          </button>
          <button onClick={() => setFullscreen(false)} className="absolute top-6 right-6 w-10 h-10 rounded-full glass-panel flex items-center justify-center">
            <span className="material-symbols-outlined text-white">close</span>
          </button>
        </div>
      )}

      {/* Background effects */}
      <div className="fixed top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full pointer-events-none opacity-30"
        style={{ background: "radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)", filter: "blur(80px)" }} />
      <div className="fixed bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full pointer-events-none opacity-20"
        style={{ background: "radial-gradient(circle, rgba(5,102,217,0.15) 0%, transparent 70%)", filter: "blur(80px)" }} />

      {/* Navigation */}
      <header className="bg-surface/80 backdrop-blur-xl border-b border-white/8 fixed top-0 w-full z-50">
        <div className="flex justify-between items-center px-6 md:px-12 h-16 w-full max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 rounded-lg cta-gradient flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            </div>
            <span className="font-korean-bold text-white text-base">CardGen AI</span>
          </Link>
          <div className="hidden md:flex gap-8">
            <Link className="text-white/60 font-medium hover:text-primary transition-colors text-sm" href="/">홈</Link>
          </div>
          <button
            onClick={() => router.push("/")}
            className="cta-gradient text-white font-korean-bold px-5 py-2 rounded-full text-sm active:scale-95 transition-transform"
          >
            새로 만들기
          </button>
        </div>
      </header>

      <main className="pt-20 pb-20 px-6 md:px-12 max-w-7xl mx-auto">
        {/* Header */}
        <section className="mb-8 pt-4">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 text-xs font-bold">생성 완료</span>
            </div>
            {meta && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full glass-panel">
                <span className="material-symbols-outlined text-primary text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  photo_camera
                </span>
                <span className="text-white/60 text-xs">Instagram 카드뉴스</span>
              </div>
            )}
          </div>
          <h1 className="font-korean-bold text-2xl md:text-3xl text-white mb-1">
            <span className="text-primary">{data.title}</span>
          </h1>
          {meta && (
            <p className="text-white/40 text-sm">
              키워드: <span className="text-white/60 font-medium">{meta.keyword}</span>
            </p>
          )}
        </section>

        {/* ── INSTAGRAM LAYOUT ── */}
        {instagramData && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Phone Preview */}
            <div className="lg:col-span-5 flex flex-col items-center sticky top-24">
              {/* Instagram phone frame - square ratio */}
              <div className="relative w-[300px] bg-[#111] rounded-[44px] border-[5px] border-[#2a2a2a] shadow-2xl overflow-hidden"
                style={{ height: "540px", boxShadow: "0 40px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)" }}>
                {/* Status bar */}
                <div className="absolute top-0 left-0 right-0 h-7 flex items-center justify-between px-5 z-20 bg-black/30">
                  <span className="text-white/60 text-[9px] font-bold">9:41</span>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-4 bg-black rounded-b-xl" />
                  <div className="flex items-center gap-1">
                    <span className="text-white/50 text-[8px]">●●●</span>
                  </div>
                </div>

                {/* Instagram top bar */}
                <div className="absolute top-7 left-0 right-0 h-10 bg-white flex items-center px-3 gap-2 z-20 border-b border-gray-100">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 flex-shrink-0" />
                  <span className="text-gray-800 font-bold text-[11px]">cardgen_ai</span>
                  <div className="ml-auto flex gap-2">
                    <span className="material-symbols-outlined text-gray-700 text-[18px]">favorite_border</span>
                    <span className="material-symbols-outlined text-gray-700 text-[18px]">send</span>
                  </div>
                </div>

                {/* Slide track */}
                <div className="absolute top-[68px] left-0 right-0 bottom-10 overflow-hidden">
                  <div className="flex h-full transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
                    style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                    {instagramData.slides.map((s, i) => (
                      <div key={i} className="min-w-full h-full flex-shrink-0">
                        <InstagramSlideCard slide={s} total={totalSlides} keyword={meta?.keyword || ""} onEdit={handleEditSlide} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Instagram bottom bar */}
                <div className="absolute bottom-0 left-0 right-0 h-10 bg-white border-t border-gray-100 flex items-center px-3 gap-3 z-20">
                  <span className="material-symbols-outlined text-gray-700 text-[20px]">favorite_border</span>
                  <span className="material-symbols-outlined text-gray-700 text-[20px]">chat_bubble_outline</span>
                  <span className="material-symbols-outlined text-gray-700 text-[20px]">send</span>
                  <span className="material-symbols-outlined text-gray-700 text-[20px] ml-auto">bookmark_border</span>
                </div>

                {/* Left/right tap zones */}
                <button onClick={prevSlide} className="absolute left-0 top-16 bottom-10 w-1/3 z-10 opacity-0" aria-label="prev" />
                <button onClick={nextSlide} className="absolute right-0 top-16 bottom-10 w-1/3 z-10 opacity-0" aria-label="next" />
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3 mt-5">
                <button onClick={prevSlide} id="prev-slide-btn"
                  className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 transition-colors active:scale-90">
                  <span className="material-symbols-outlined text-white text-lg">chevron_left</span>
                </button>
                <div className="flex gap-1.5">
                  {instagramData.slides.map((_, i) => (
                    <button key={i} onClick={() => setCurrentSlide(i)}
                      className={`rounded-full transition-all duration-300 ${i === currentSlide ? "w-5 h-1.5 bg-primary" : "w-1.5 h-1.5 bg-white/20"}`} />
                  ))}
                </div>
                <button onClick={nextSlide} id="next-slide-btn"
                  className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 transition-colors active:scale-90">
                  <span className="material-symbols-outlined text-white text-lg">chevron_right</span>
                </button>
                <button onClick={() => setFullscreen(true)}
                  className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 transition-colors active:scale-90 ml-1">
                  <span className="material-symbols-outlined text-white text-lg">fullscreen</span>
                </button>
              </div>

              {/* AI Metrics */}
              <div className="mt-5 w-full max-w-[300px] glass-panel rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary text-sm">auto_graph</span>
                  <h4 className="text-white font-korean-bold text-sm">AI 성과 예측 지표</h4>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {METRIC_LIST.map(({ key, label, icon }) => (
                    <ScoreRing key={key} value={instagramData.metrics[key]} label={label} icon={icon} />
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Details */}
            <div className="lg:col-span-7 space-y-5">
              {/* Slide grid overview */}
              <div className="glass-panel rounded-2xl p-5">
                <h4 className="text-white font-korean-bold mb-4 flex items-center gap-2 text-sm">
                  <span className="material-symbols-outlined text-primary text-sm">grid_view</span>
                  전체 슬라이드 미리보기
                </h4>
                <div className="grid grid-cols-5 gap-2">
                  {instagramData.slides.map((s, i) => (
                    <button key={i} onClick={() => setCurrentSlide(i)}
                      className={`relative rounded-xl overflow-hidden transition-all duration-200 ${i === currentSlide ? "ring-2 ring-primary scale-105" : "opacity-50 hover:opacity-80"}`}
                      style={{ aspectRatio: "1/1" }}>
                      <div className="absolute inset-0">
                        <InstagramSlideCard slide={s} total={totalSlides} keyword={meta?.keyword || ""} />
                      </div>
                      {i === currentSlide && <div className="absolute inset-0 bg-primary/10" />}
                      <div className="absolute bottom-1 left-0 right-0 text-center">
                        <span className="text-[7px] text-white/80 font-bold bg-black/40 px-1 rounded">{i + 1}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Caption & Hashtags */}
              <div className="glass-panel p-5 rounded-2xl space-y-4">
                <h4 className="text-white font-korean-bold flex items-center gap-2 text-sm">
                  <span className="material-symbols-outlined text-primary text-sm">edit_note</span>
                  인스타그램 캡션
                </h4>
                <div className="relative bg-white/3 rounded-xl p-4 border border-white/5">
                  <p className="text-white/80 text-sm leading-relaxed pr-8">{instagramData.caption}</p>
                  <button onClick={() => copyText("caption")} id="copy-caption-btn"
                    className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors">
                    <span className="material-symbols-outlined text-sm" style={{ color: copied === "caption" ? "#4cd7f6" : "rgba(255,255,255,0.4)" }}>
                      {copied === "caption" ? "check" : "content_copy"}
                    </span>
                  </button>
                </div>
                <div className="border-t border-white/5 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-white font-korean-bold text-sm flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-sm">tag</span>
                      해시태그
                    </h4>
                    <button onClick={() => copyText("hashtags")} id="copy-hashtags-btn"
                      className="flex items-center gap-1 text-xs hover:text-white transition-colors"
                      style={{ color: copied === "hashtags" ? "#4cd7f6" : "rgba(255,255,255,0.4)" }}>
                      <span className="material-symbols-outlined text-xs">{copied === "hashtags" ? "check" : "content_copy"}</span>
                      {copied === "hashtags" ? "복사됨!" : "전체 복사"}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {instagramData.hashtags.map((tag, i) => (
                      <span key={i} className="px-3 py-1 rounded-full text-sm font-medium border border-pink-500/20"
                        style={{ background: "rgba(244,114,182,0.08)", color: "#f472b6" }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Download actions */}
              <div className="glass-panel p-5 rounded-2xl">
                <h4 className="text-white font-korean-bold text-sm mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-sm">download</span>
                  내보내기
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <button className="py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-colors flex items-center justify-center gap-2 text-white text-sm font-korean-bold">
                    <span className="material-symbols-outlined text-sm">image</span>
                    이미지 ZIP
                  </button>
                  <button onClick={() => copyText("caption")}
                    className="py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-colors flex items-center justify-center gap-2 text-white text-sm font-korean-bold">
                    <span className="material-symbols-outlined text-sm">content_copy</span>
                    캡션 복사
                  </button>
                </div>
              </div>

              {/* New content */}
              <button onClick={() => router.push("/")}
                className="w-full py-3 rounded-xl border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-2 text-sm">
                <span className="material-symbols-outlined text-sm">refresh</span>
                <span className="font-korean-reg">새 콘텐츠 만들기</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-lowest w-full py-8 border-t border-white/5">
        <div className="flex flex-col md:flex-row justify-between items-center px-6 md:px-12 gap-4 max-w-7xl mx-auto">
          <span className="font-korean-bold text-white">CardGen AI</span>
          <p className="text-white/30 text-xs">© 2025 CardGen AI. Powered by Gemini 2.5 Flash.</p>
        </div>
      </footer>
    </>
  );
}

export default function PreviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white font-korean-reg">로딩 중...</div>}>
      <PreviewContent />
    </Suspense>
  );
}
