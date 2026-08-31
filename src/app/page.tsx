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
    { value: 98, label: "AI 정확도", suffix: "%" },
    { value: 3, label: "평균 생성 시간", suffix: "초" },
    { value: 50, label: "무료 생성 횟수", suffix: "회+" },
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
              <span className="text-white/60 text-[28px] md:text-[48px]">AI가 3초 만에 완성</span>
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
                  placeholder="예: 2024 트렌드 소비자 동향 분석"
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
              <p className="text-white/30 text-xs mt-2 text-center">URL 입력 시 해당 페이지 내용을 자동으로 분석합니다</p>
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
                  <p className="text-white/40 text-sm">1:1 정방형 · 5장 슬라이드</p>
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
                {["1:1 정방형 카드 5장 자동 생성", "슬라이드별 AI 이미지 매칭", "캡션 + 해시태그 자동 작성", "성과 예측 AI 지표 (좋아요·공유·CTR)"].map((item) => (
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
              { num: "02", icon: "neurology", title: "AI 자동 생성", desc: "Gemini AI가 실시간 검색 후 카드뉴스 5장을 생성합니다.", color: "from-violet-500 to-purple-600" },
              { num: "03", icon: "download", title: "복사 & 게시", desc: "텍스트 복사 또는 이미지 다운로드 후 바로 SNS에 올리면 끝!", color: "from-pink-500 to-rose-600" },
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

        {/* ─── AI Metrics Section ───────────────────────────── */}
        <section id="examples" className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-korean-bold text-3xl md:text-5xl text-white mb-4">발행 전 성과 예측</h2>
            <p className="font-korean-reg text-white/50 text-base max-w-xl mx-auto">
              AI가 생성한 콘텐츠의 예상 성과 지표를 미리 확인하세요
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {[
              { icon: "visibility", label: "주목도", pct: "87%", desc: "첫 화면 시선 집중" },
              { icon: "ads_click", label: "클릭률", pct: "74%", desc: "링크·프로필 클릭 유도" },
              { icon: "timer", label: "체류시간", pct: "92%", desc: "슬라이드 완독률" },
              { icon: "share", label: "공유율", pct: "67%", desc: "스토리 공유·DM 전달" },
              { icon: "favorite", label: "좋아요", pct: "89%", desc: "감성 공감 지수" },
              { icon: "repeat", label: "저장률", pct: "61%", desc: "북마크 저장 예측" },
            ].map(({ icon, label, pct, desc }) => (
              <div key={label} className="glass-panel p-6 rounded-2xl group hover:border-primary/30 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-primary text-xl">{icon}</span>
                  </div>
                  <span className="font-korean-bold text-2xl text-primary">{pct}</span>
                </div>
                <h4 className="font-korean-bold text-white text-base mb-1">{label}</h4>
                <p className="text-white/40 text-xs">{desc}</p>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mt-4">
                  <div className="h-full bg-primary rounded-full" style={{ width: pct }} />
                </div>
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
                로그인 없이 바로 시작할 수 있어요.<br />첫 50개는 완전 무료입니다.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleGenerate}
                  className="cta-gradient text-white px-10 py-4 rounded-2xl font-korean-bold text-lg shadow-2xl hover:scale-105 active:scale-95 transition-all"
                  style={{ boxShadow: "0 20px 60px rgba(6,182,212,0.35)" }}
                >
                  무료 생성 시작하기 →
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
