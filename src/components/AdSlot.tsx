"use client";

import { useEffect, useRef } from "react";
import { ADSENSE_CLIENT } from "@/lib/site";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * 애드센스 광고 칸 하나.
 *
 * **게시자 번호(`NEXT_PUBLIC_ADSENSE_CLIENT`)와 광고 단위 번호(`slot`) 둘 다
 * 있어야 그린다.** 하나라도 없으면 아무것도 그리지 않는다(빈 칸도 안 남긴다).
 * 그래서 이 코드가 배포돼 있어도 애드센스 승인 전에는 화면에 아무 변화가 없다.
 *
 * 자리: 생성 대기 화면과 결과 화면 맨 아래. 버튼 옆에는 두지 않는다. 실수로
 * 누르기 쉬운 자리는 애드센스 정책 위반이다. 카드 이미지 안에는 넣지 않는다.
 */
export default function AdSlot({ slot, className, height }: { slot: string; className?: string; height: number }) {
  const ref = useRef<HTMLModElement>(null);
  const enabled = Boolean(ADSENSE_CLIENT && /^\d{6,20}$/.test(slot));

  useEffect(() => {
    if (!enabled || !ref.current || ref.current.dataset.adsbygoogleStatus) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // 광고 차단기 등으로 스크립트가 없으면 조용히 넘어간다. 화면은 그대로다.
    }
  }, [enabled]);

  if (!enabled) return null;
  return (
    <div className={className} style={{ width: "100%", minHeight: height }}>
      <p className="text-white/25 text-[10px] mb-1 text-center">광고</p>
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: "block", width: "100%", height }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-full-width-responsive="true"
      />
    </div>
  );
}

/** 광고 단위 번호. 애드센스에서 광고 단위를 만들면 받는 숫자. 비어 있으면 그 칸을 안 그린다. */
export const AD_SLOTS = {
  loading: process.env.NEXT_PUBLIC_ADSENSE_SLOT_LOADING?.trim() ?? "",
  result: process.env.NEXT_PUBLIC_ADSENSE_SLOT_RESULT?.trim() ?? "",
};
