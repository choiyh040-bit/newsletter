"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const STATUS_MESSAGES = [
  "기사 본문 확인 중...",
  "최신 사실 관계 검색 중...",
  "카드 구성 설계 중...",
  "문장 다시 쓰는 중...",
  "줄바꿈 다듬는 중...",
  "캡션과 해시태그 작성 중...",
  "마무리 정리 중...",
];

function LoadingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const keyword = searchParams.get("keyword") ?? "";
  const url = searchParams.get("url") ?? "";

  const [progress, setProgress] = useState(0);
  const [statusIdx, setStatusIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    let currentProgress = 0;
    const totalDuration = 12000;
    const intervalMs = 80;
    const increment = 100 / (totalDuration / intervalMs);

    const animInterval = setInterval(() => {
      currentProgress = Math.min(currentProgress + increment, 95);
      setProgress(currentProgress);
      setStatusIdx(Math.floor((currentProgress / 100) * STATUS_MESSAGES.length));
    }, intervalMs);

    const generate = async () => {
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keyword, url }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? "생성 실패");
        }

        const data = await res.json();
        sessionStorage.setItem("cardNewsData", JSON.stringify(data));
        sessionStorage.setItem(
          "cardNewsMeta",
          JSON.stringify({ keyword, createdAt: new Date().toISOString() })
        );

        clearInterval(animInterval);

        let p = currentProgress;
        const finishInterval = setInterval(() => {
          p = Math.min(p + 2, 100);
          setProgress(p);
          setStatusIdx(STATUS_MESSAGES.length - 1);
          if (p >= 100) {
            clearInterval(finishInterval);
            setTimeout(() => router.push("/preview"), 600);
          }
        }, 30);
      } catch (err: unknown) {
        clearInterval(animInterval);
        const msg = err instanceof Error ? err.message : "알 수 없는 오류";
        setError(msg);
      }
    };

    generate();
    return () => clearInterval(animInterval);
  }, [keyword, url, router]);

  const circumference = 508;
  const dashOffset = circumference - (progress / 100) * circumference;
  const statusMessage = STATUS_MESSAGES[Math.min(statusIdx, STATUS_MESSAGES.length - 1)];

  if (error) {
    const isRateLimit = error.includes("429") || error.includes("할당량") || error.includes("Resource has been exhausted");
    const displayError = isRateLimit
      ? "현재 이용자가 많아 AI 서버 접속이 지연되고 있습니다. 약 1분 후 다시 시도해주세요."
      : error;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="w-20 h-20 rounded-2xl glass-panel flex items-center justify-center">
          <span className="material-symbols-outlined text-red-400 text-4xl">error</span>
        </div>
        <h2 className="font-korean-bold text-2xl text-white">
          {isRateLimit ? "서버 혼잡 안내" : "생성 중 오류가 발생했습니다"}
        </h2>
        <p className="text-white/70 font-korean-reg max-w-md leading-relaxed whitespace-pre-line">{displayError}</p>
        <div className="flex gap-4">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors font-korean-reg"
          >
            돌아가기
          </button>
          <button
            onClick={() => {
              hasFetched.current = false;
              setError(null);
              setProgress(0);
              window.location.reload();
            }}
            className="px-6 py-3 rounded-xl cta-gradient text-white font-korean-bold"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Navigation */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-white/8 h-16">
        <nav className="flex justify-between items-center px-6 md:px-12 h-full max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 rounded-lg cta-gradient flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            </div>
            <span className="font-korean-bold text-white text-base">CardGen AI</span>
          </Link>
          <div className="flex items-center gap-3 px-4 py-1.5 rounded-full glass-panel">
            <span className="material-symbols-outlined text-primary text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              photo_camera
            </span>
            <span className="text-white/60 text-xs font-medium">
              Instagram 카드뉴스 생성 중
            </span>
          </div>
          <button className="cta-gradient text-surface px-4 py-2 rounded-full font-korean-bold text-sm active:scale-95 transition-transform">
            생성 중...
          </button>
        </nav>
      </header>

      <main className="relative pt-16 h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 opacity-10 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(6,182,212,0.5) 0%, transparent 70%)", filter: "blur(120px)" }} />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 opacity-10 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(5,102,217,0.5) 0%, transparent 70%)", filter: "blur(120px)" }} />
          <div
            className="absolute top-0 left-0 w-full h-full opacity-5"
            style={{
              backgroundImage: "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        {/* Scanning line */}
        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden opacity-20">
          <div
            className="w-full h-px bg-gradient-to-r from-transparent via-primary to-transparent absolute"
            style={{ animation: "scan-line 3s linear infinite" }}
          />
        </div>

        {/* Main loader */}
        <div className="relative z-20 flex flex-col items-center w-full max-w-4xl px-6">
          {/* Progress ring */}
          <div className="relative mb-8">
            <div className="absolute inset-0 rounded-full opacity-20 blur-3xl animate-pulse"
              style={{ background: "linear-gradient(135deg, #f58529, #dd2a7b)" }} />
            <div className="relative w-44 h-44 md:w-52 md:h-52 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="50%" cy="50%" fill="transparent" r="45%" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <circle
                  cx="50%"
                  cy="50%"
                  fill="transparent"
                  r="45%"
                  stroke="url(#instagramGradient)"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  strokeWidth="8"
                  className="transition-all duration-500 ease-out"
                />
                <defs>
                  <linearGradient id="instagramGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f58529" />
                    <stop offset="50%" stopColor="#dd2a7b" />
                    <stop offset="100%" stopColor="#8134af" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className="material-symbols-outlined text-4xl animate-pulse"
                  style={{
                    fontVariationSettings: "'FILL' 1",
                    color: "#dd2a7b",
                  }}
                >
                  photo_camera
                </span>
                <div className="font-korean-bold text-5xl md:text-6xl mt-1 text-white font-extrabold">
                  {Math.floor(progress)}%
                </div>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="text-center space-y-3 mb-10 max-w-2xl">
            <h2 className="font-korean-bold text-2xl md:text-3xl text-white leading-tight">
              인스타그램 카드뉴스 생성 중...
            </h2>
            <div className="flex items-center justify-center gap-3 text-white/60">
              <span className="inline-block w-2 h-2 rounded-full bg-primary animate-ping" />
              <p className="font-korean-reg text-white/80 text-sm">{statusMessage}</p>
            </div>
          </div>


          {/* Log bar */}
          <div className="mt-8 w-full glass-panel p-3 px-4 rounded-xl flex items-center gap-4 border border-white/5">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-400 opacity-60" />
              <div className="w-2 h-2 rounded-full bg-primary" />
              <div className="w-2 h-2 rounded-full bg-primary/40" />
            </div>
            <div className="flex-1 h-px bg-white/10" />
            <code className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
              cardgen_ai · instagram · keyword=&quot;{keyword}&quot;
            </code>
          </div>
        </div>
      </main>
    </>
  );
}

export default function LoadingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">로딩 중...</div>}>
      <LoadingContent />
    </Suspense>
  );
}
