"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [animatedStats, setAnimatedStats] = useState([0, 0, 0]);
  const heroRef = useRef<HTMLDivElement>(null);

  const stats = [
    { value: 1080, label: "카드 가로", suffix: "px" },
    { value: 1350, label: "카드 세로", suffix: "px" },
    { value: 5, label: "장당 카드 수", suffix: "장" },
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      stats.forEach((stat, i) => {
        let current = 0;
        const step = stat.value / 60;
        const interval = setInterval(() => {
          current = Math.min(current + step, stat.value);
          setAnimatedStats((prev) => {
            const next = [...prev];
            next[i] = Math.floor(current);
            return next;
          });
          if (current >= stat.value) clearInterval(interval);
        }, 16);
      });
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const handleGenerate = () => {
    if (!query.trim()) return;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = query.match(urlRegex);
    const extractedUrl = urls ? urls[0] : "";
    let extractedKeyword = query.replace(urlRegex, "").trim();
    if (!extractedKeyword && extractedUrl) {
      extractedKeyword = "웹페이지 내용 분석 및 요약";
    } else if (!extractedKeyword) {
      extractedKeyword = query.trim();
    }
    const params = new URLSearchParams({ keyword: extractedKeyword });
    if (extractedUrl) params.append("url", extractedUrl);
    router.push(`/loading?${params.toString()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleGenerate();
  };

  return (
    <>
      {/* ─── TopNav ─────────────────────────────────────────── */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-white/8">
        <div className="flex justify-between items-center px-6 md:px-12 h-16 w-full max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-xl cta-gradient flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                auto_awesome
              </span>
            </div>
            <span className="font-korean-bold text-lg text-white tracking-tight">CardGen AI</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link className="text-white/80 font-medium hover:text-primary transition-colors text-sm" href="/">홈</Link>
            <Link className="text-white/50 font-medium hover:text-primary transition-colors text-sm" href="#features">기능</Link>
            <Link className="text-white/50 font-medium hover:text-primary transition-colors text-sm" href="#examples">예시</Link>
          </nav>
          <button
            onClick={handleGenerate}
            className="cta-gradient text-white px-5 py-2 rounded-full text-sm font-korean-bold hover:brightness-110 active:scale-95 transition-all shadow-lg"
            style={{ boxShadow: "0 4px 20px rgba(6,182,212,0.3)" }}
          >
            지금 시작하기
          </button>
        </div>
      </header>

      <main className="pt-16">
        {/* ─── Hero Section ────────────────────────────────── */}
        <section ref={heroRef} className="relative min-h-[100svh] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
          {/* Aurora BG */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-30"
              style={{ background: "radial-gradient(circle, rgba(6,182,212,0.4) 0%, transparent 65%)", filter: "blur(80px)" }} />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-20"
              style={{ background: "radial-gradient(circle, rgba(5,102,217,0.5) 0%, transparent 65%)", filter: "blur(80px)" }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] opacity-10"
              style={{ background: "radial-gradient(ellipse, rgba(76,215,246,0.3) 0%, transparent 70%)", filter: "blur(40px)" }} />
          </div>

          <div className="relative z-10 max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel mb-6 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
              <span className="text-white/70 text-xs font-medium">Gemini 2.5 Flash 기반 · 실시간 검색 지원</span>
            </div>

            <h1 className="font-korean-bold text-[38px] md:text-[72px] leading-[1.15] text-white mb-6">
              <span className="text-primary">인스타그램 카드뉴스</span>
              <br />
              <span className="text-white/60 text-[28px] md:text-[48px]">기사 하나로 5장 완성</span>
            </h1>

            <p className="font-korean-reg text-white/60 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
              키워드나 URL 하나만 입력하면, AI가 최신 뉴스를 검색해<br className="hidden md:block" />
              인스타그램 카드뉴스 5장을 한 번에 생성합니다.
            </p>

            {/* Input */}
            <div className="relative w-full max-w-2xl mx-auto">
              <div className="relative flex items-center glass-panel p-2 rounded-2xl border border-white/10 hover:border-primary/40 transition-colors"
                style={{ boxShadow: "0 0 40px rgba(6,182,212,0.1)" }}>
                <span className="material-symbols-outlined ml-4 text-primary/70">search</span>
                <input
                  id="query-input"
                  className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-white/30 font-korean-reg px-4 py-3 outline-none text-[15px]"
                  placeholder="기사 URL 붙여넣기 (또는 키워드만 입력)"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button
                  id="generate-btn"
                  onClick={handleGenerate}
                  disabled={!query.trim()}
                  className="cta-gradient text-white px-7 py-3 rounded-xl font-korean-bold text-sm flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  생성하기
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                </button>
              </div>
              <p className="text-white/30 text-xs mt-2 text-center">기사 URL을 함께 넣으면 그 본문을 근거로 만듭니다</p>
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-8 md:gap-16 mt-14">
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="font-korean-bold text-2xl md:text-3xl text-primary">
                    {animatedStats[i]}{stat.suffix}
                  </div>
                  <div className="text-white/40 text-xs mt-1 font-korean-reg">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Preview Image */}
          <div className="relative mt-14 w-full max-w-4xl mx-auto px-4">
            <div className="relative rounded-3xl overflow-hidden glass-panel border border-white/10"
              style={{ boxShadow: "0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)" }}>
              <Image
                src="/hero_mockup.png"
                alt="인스타그램 카드뉴스 생성 예시"
                width={1200}
                height={600}
                className="w-full object-cover opacity-80"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
            </div>
          </div>
        </section>

        {/* ─── Features Section ─────────────────────────────── */}
        <section id="features" className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel mb-4">
              <span className="material-symbols-outlined text-primary text-[14px]">auto_awesome</span>
              <span className="text-white/70 text-xs font-medium">핵심 기능</span>
            </div>
            <h2 className="font-korean-bold text-3xl md:text-5xl text-white mb-4">인스타그램에 집중합니다</h2>
            <p className="font-korean-reg text-white/50 text-base max-w-xl mx-auto">
              카드뉴스 하나만 제대로. 인스타그램 피드에 최적화된 콘텐츠를 생성합니다.
            </p>
          </div>

          <div className="grid grid-cols-1 max-w-xl mx-auto">
            {/* Instagram Feature Card */}
            <div className="glass-panel rounded-3xl p-8 border border-white/8 hover:border-pink-500/30 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 pointer-events-none"
                style={{ background: "radial-gradient(circle, #f58529, transparent)", filter: "blur(40px)" }} />
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #f58529, #dd2a7b, #8134af)" }}>
                  <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>photo_camera</span>
                </div>
                <div>
                  <h3 className="font-korean-bold text-white text-xl">Instagram 카드뉴스</h3>
                  <p className="text-white/40 text-sm">1080 × 1350 (4:5) · 4~5장</p>
                </div>
              </div>
              <div className="relative rounded-2xl overflow-hidden mb-6" style={{ aspectRatio: "1/1", maxHeight: "280px" }}>
                <Image src="/instagram_card_preview.png" alt="인스타그램 카드뉴스 예시" fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex gap-1.5 justify-center">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className={`h-1.5 rounded-full bg-white ${i === 0 ? "w-6" : "w-1.5 opacity-40"}`} />
                    ))}
                  </div>
                </div>
              </div>
              <ul className="space-y-3">
                {["기사 URL 붙여넣으면 본문까지 읽어옴", "표지 + 상세 + 마무리 구조로 자동 구성", "캡션 + 해시태그 + 출처 자동 작성", "PNG 한 장씩 또는 전체 ZIP으로 저장"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-white/70 text-sm">
                    <span className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, #f58529, #dd2a7b)" }}>
                      <span className="material-symbols-outlined text-white text-[12px]">check</span>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </section>

        {/* ─── How It Works ─────────────────────────────────── */}
        <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-korean-bold text-3xl md:text-5xl text-white mb-4">3단계로 끝</h2>
            <p className="font-korean-reg text-white/50 text-base">복잡한 과정 없이 단 3단계만 거치면 완성입니다</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { num: "01", icon: "edit", title: "키워드 입력", desc: "뉴스 주제나 URL을 자유롭게 입력하세요. 길게 쓸 필요 없어요.", color: "from-cyan-500 to-blue-600" },
              { num: "02", icon: "neurology", title: "AI 자동 생성", desc: "기사 본문을 읽고 사실을 확인한 뒤 카드 5장을 구성합니다.", color: "from-violet-500 to-purple-600" },
              { num: "03", icon: "download", title: "PNG 저장", desc: "카드 5장을 PNG로 내려받고 캡션을 복사해 그대로 올리면 끝!", color: "from-pink-500 to-rose-600" },
            ].map((step) => (
              <div key={step.num} className="glass-panel rounded-3xl p-8 border border-white/8 hover:border-white/15 transition-all text-center group">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform shadow-lg`}>
                  <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>{step.icon}</span>
                </div>
                <div className="text-primary/40 font-mono text-xs font-bold mb-2">{step.num}</div>
                <h3 className="font-korean-bold text-white text-xl mb-3">{step.title}</h3>
                <p className="font-korean-reg text-white/50 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── 제작 규칙 ─────────────────────────────────── */}
        <section id="examples" className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-korean-bold text-3xl md:text-5xl text-white mb-4">지키는 규칙</h2>
            <p className="font-korean-reg text-white/50 text-base max-w-xl mx-auto">
              그럴듯해 보이는 것보다, 올려도 문제 없는 것을 만듭니다.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {[
              {
                icon: "edit_note",
                title: "원문을 베끼지 않습니다",
                desc: "기사 문장을 그대로 옮기지 않고 새 문장으로 다시 씁니다. 직접인용은 15단어 미만으로 한 번만 씁니다.",
              },
              {
                icon: "copyright",
                title: "저작권 안전한 배경만",
                desc: "출처가 불분명한 보도용 사진이나 스톡 이미지를 쓰지 않습니다. 기본은 그라데이션과 타이포그래피입니다.",
              },
              {
                icon: "format_line_spacing",
                title: "줄바꿈을 직접 끊습니다",
                desc: "브라우저 자동 줄바꿈에 맡기면 서술어가 혼자 남습니다. 의미 단위로 미리 나눠서 렌더링합니다.",
              },
              {
                icon: "crop_portrait",
                title: "1080 × 1350 고정",
                desc: "인스타그램 세로 피드에 잘리지 않고 들어가는 4:5 규격으로 뽑습니다. 미리보기와 저장 결과가 같습니다.",
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="glass-panel p-6 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-primary text-xl">{icon}</span>
                </div>
                <h4 className="font-korean-bold text-white text-base mb-2">{title}</h4>
                <p className="text-white/50 text-sm leading-relaxed font-korean-reg">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── CTA Section ─────────────────────────────────── */}
        <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
          <div className="relative glass-panel rounded-[40px] p-12 md:p-20 text-center overflow-hidden border border-white/8">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] opacity-20"
                style={{ background: "radial-gradient(ellipse, rgba(6,182,212,0.6) 0%, transparent 70%)", filter: "blur(60px)" }} />
            </div>
            <div className="relative z-10">
              <h2 className="font-korean-bold text-3xl md:text-5xl text-white mb-5">
                지금 바로 무료로<br />카드뉴스 만들기
              </h2>
              <p className="font-korean-reg text-white/60 text-base max-w-lg mx-auto mb-10 leading-relaxed">
                로그인 없이 바로 시작할 수 있어요.<br />만든 카드는 PNG로 바로 내려받습니다.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleGenerate}
                  className="cta-gradient text-white px-10 py-4 rounded-2xl font-korean-bold text-lg shadow-2xl hover:scale-105 active:scale-95 transition-all"
                  style={{ boxShadow: "0 20px 60px rgba(6,182,212,0.35)" }}
                >
                  카드뉴스 만들기 →
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ─── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-white/5 bg-surface-container-lowest py-10">
        <div className="flex flex-col md:flex-row justify-between items-center px-6 md:px-12 gap-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg cta-gradient flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            </div>
            <span className="font-korean-bold text-white text-base">CardGen AI</span>
          </div>
          <p className="text-white/30 text-xs">© 2025 CardGen AI. Powered by Gemini 2.5 Flash.</p>
          <div className="flex gap-6">
            <a className="text-white/30 hover:text-white/60 transition-colors text-xs" href="#">개인정보처리방침</a>
            <a className="text-white/30 hover:text-white/60 transition-colors text-xs" href="#">이용약관</a>
          </div>
        </div>
      </footer>
    </>
  );
}
