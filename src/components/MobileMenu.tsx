"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { SITE_MENU, type MenuItem } from "@/lib/siteMenu";

/**
 * 휴대폰용 메뉴(☰). 넓은 화면에서는 숨는다(`md:hidden`) — 그때는 머리의 가로 메뉴가 보인다.
 *
 * 홈 머리의 메뉴가 `hidden md:flex` 라 휴대폰에서는 사용법·피드백으로 갈 길이 맨 아래
 * 꼬리말뿐이었다(2026-10-16 사용자 지적). 아래 고정 막대는 다른 화면의 홈 단추와 겹치고,
 * 가로로 미는 탭은 뒤쪽 항목이 가려져서 오른쪽 위 ☰ 로 했다.
 *
 * 메뉴 칸을 누르거나, 바깥(어두운 막)을 누르거나, Esc 를 누르면 닫힌다.
 *
 * 펼친 메뉴는 **body 에 바로 붙인다(portal).** 머리(header)에 배경 흐림(backdrop-blur)이
 * 걸려 있으면 그 안의 `position: fixed` 가 화면이 아니라 머리를 기준으로 잡혀서, 어두운 막이
 * 머리 높이로 쪼그라들고 바깥을 눌러도 닫히지 않았다.
 */
export default function MobileMenu({ extra = [] }: { extra?: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    // 메뉴가 열린 동안 뒤 화면이 스크롤되지 않게.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const items = [SITE_MENU[0], ...extra, ...SITE_MENU.slice(1)];

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className="w-10 h-10 rounded-xl flex items-center justify-center text-white/80 hover:bg-white/5"
      >
        <span className="material-symbols-outlined text-[26px]">
          {open ? "close" : "menu"}
        </span>
      </button>
      {open &&
        createPortal(
          <>
            <div
              className="fixed inset-0 top-16 z-40 bg-black/50"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <nav
              id={id}
              aria-label="사이트 메뉴"
              className="fixed left-0 right-0 top-16 z-50 bg-surface border-b border-white/10 shadow-2xl ko-text"
            >
              <ul
                className="py-2"
                style={{ listStyle: "none", margin: 0, paddingLeft: 0 }}
              >
                {items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="block px-6 py-3.5 text-white/85 text-[15px] font-korean-bold hover:bg-white/5"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </>,
          document.body,
        )}
    </div>
  );
}
