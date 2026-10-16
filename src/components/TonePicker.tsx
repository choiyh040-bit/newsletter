"use client";

import { chooseTone, useDesignChoice } from "@/lib/cardNewsStore";
import { DEFAULT_TONE, TONES } from "@/lib/tone";

/**
 * 글의 말투 고르기. 뉴스형·정보형·홍보형. 마지막으로 고른 것을 기억한다.
 * 고른 말투의 한 줄 설명을 아래에 보여 준다. 칩 이름만으로는 차이를 짐작하기 어렵다.
 */
export default function TonePicker() {
  const design = useDesignChoice();
  const current = design.tone ?? DEFAULT_TONE;
  const hint = TONES.find((t) => t.id === current)?.hint;

  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center justify-center gap-1.5 md:gap-2" role="radiogroup" aria-label="말투">
        <span className="text-white/50 text-xs font-korean-bold mr-1 whitespace-nowrap">말투</span>
        {TONES.map((t) => {
          const on = t.id === current;
          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => chooseTone(t.id)}
              className={`px-3 md:px-3.5 py-1.5 rounded-full text-xs font-korean-bold border transition-colors whitespace-nowrap ${
                on ? "border-primary/70 bg-primary/15 text-white" : "border-white/12 text-white/55 hover:text-white/80"
              }`}
            >
              {t.name}
            </button>
          );
        })}
      </div>
      <p className="text-white/35 text-xs mt-2 text-center">{hint}</p>
    </div>
  );
}
