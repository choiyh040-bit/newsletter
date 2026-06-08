"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function FloatingHome() {
  const pathname = usePathname();
  // 메인 홈페이지에서는 렌더링하지 않음
  if (pathname === "/") return null;

  return (
    <Link 
      href="/" 
      className="fixed bottom-8 right-8 z-[9999] bg-cyan-500 hover:bg-cyan-400 text-white p-4 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 ring-4 ring-cyan-500/30"
      title="홈으로 돌아가기"
    >
      <span className="material-symbols-outlined text-3xl font-bold">home</span>
    </Link>
  );
}
