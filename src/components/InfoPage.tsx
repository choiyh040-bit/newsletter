import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

/**
 * 소개·사용법·개인정보처리방침·이용약관 같은 글 페이지의 틀.
 *
 * 홈과 같은 어두운 바탕에, 글 읽기 좋은 폭(최대 720px)으로 둔다. 아래에 같은
 * 묶음의 다른 페이지로 가는 링크를 단다. 애드센스 심사는 사이트에 이런 안내
 * 페이지가 있고 서로 이어져 있는지를 본다.
 */
export const INFO_LINKS = [
  { href: "/about", label: "서비스 소개" },
  { href: "/guide", label: "사용법·자주 묻는 질문" },
  { href: "/privacy", label: "개인정보처리방침" },
  { href: "/terms", label: "이용약관" },
] as const;

export default function InfoPage({
  title,
  lead,
  children,
}: {
  title: string;
  lead?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-white/8">
        <div className="flex justify-between items-center px-6 md:px-12 h-16 w-full max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-xl cta-gradient flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                auto_awesome
              </span>
            </div>
            <span className="font-korean-bold text-lg text-white tracking-tight">{SITE_NAME}</span>
          </Link>
          <Link
            href="/"
            className="cta-gradient text-white px-5 py-2 rounded-full text-sm font-korean-bold hover:brightness-110 transition-all"
          >
            만들러 가기
          </Link>
        </div>
      </header>

      <main className="pt-28 pb-20 px-5 md:px-6 ko-text">
        <article className="max-w-[720px] mx-auto info-doc">
          <h1 className="font-korean-bold text-white text-3xl md:text-4xl leading-tight mb-4">{title}</h1>
          {lead && <p className="text-white/60 text-base leading-relaxed font-korean-reg mb-10">{lead}</p>}
          {children}
        </article>

        <nav className="max-w-[720px] mx-auto mt-16 pt-8 border-t border-white/8 flex flex-wrap gap-x-6 gap-y-3">
          {INFO_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-white/50 hover:text-primary text-sm transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>
      </main>
    </>
  );
}

/** 글 페이지의 한 절. 제목과 본문. */
export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="font-korean-bold text-white text-xl mb-4">{title}</h2>
      <div className="text-white/70 text-[15px] leading-[1.8] font-korean-reg space-y-3">{children}</div>
    </section>
  );
}
