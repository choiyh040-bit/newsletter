"use client";

import { useState, useSyncExternalStore } from "react";
import { inAppBrowserName } from "@/lib/inApp";

const DISMISS_KEY = "inAppBannerDismissed";
const noopSubscribe = () => () => {};

function readDismissed(): boolean {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * 앱 안 브라우저(카톡 등)로 열었을 때 홈 위쪽에 띄우는 안내.
 *
 * 앱 안 브라우저는 파일 내려받기가 막혀 있어 카드를 "길게 눌러 저장"으로만 받을 수 있다(2026-10-17).
 * 크롬·사파리로 열면 ZIP 으로 한 번에 받는다. 카톡은 바깥 브라우저로 넘기는 주소
 * (`kakaotalk://web/openExternal`)가 있어 버튼을 붙이고, 다른 앱은 메뉴에서 여는 방법만 적는다.
 * 결과는 브라우저마다 따로 저장되므로 **만들기 전에** 옮기는 게 좋아 홈에만 띄운다.
 */
export default function InAppBanner() {
  const app = useSyncExternalStore(noopSubscribe, () => inAppBrowserName(navigator.userAgent), () => null);
  const dismissedAtLoad = useSyncExternalStore(noopSubscribe, readDismissed, () => true);
  const [closed, setClosed] = useState(false);
  if (!app || dismissedAtLoad || closed) return null;

  const close = () => {
    setClosed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // 저장이 막혀 있으면 이번 화면에서만 닫는다.
    }
  };
  const isKakao = app === "카카오톡";
  const openExternal = () => {
    window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(window.location.href)}`;
  };

  return (
    <div
      data-inapp-banner
      className="relative z-20 max-w-2xl mx-auto mb-6 glass-panel rounded-2xl border border-primary/30 px-4 py-3 text-left flex items-start gap-3"
    >
      <span className="material-symbols-outlined text-primary text-[20px] mt-0.5 flex-shrink-0">open_in_browser</span>
      <div className="flex-1 min-w-0">
        <p className="text-white/85 text-sm font-korean-reg leading-relaxed">
          {app} 안에서 열렸어요. <strong className="text-white">크롬·사파리로 열면</strong> 카드를 ZIP 으로 한 번에
          받을 수 있어요.
          {!isKakao && " 오른쪽 위 메뉴에서 '다른 브라우저로 열기'를 눌러 주세요."}
        </p>
        {isKakao && (
          <button
            onClick={openExternal}
            className="mt-2 cta-gradient text-white px-4 py-1.5 rounded-full text-xs font-korean-bold"
          >
            크롬·사파리로 열기
          </button>
        )}
      </div>
      <button onClick={close} aria-label="안내 닫기" className="text-white/40 hover:text-white/80 flex-shrink-0 -mr-1">
        <span className="material-symbols-outlined text-[18px]">close</span>
      </button>
    </div>
  );
}
