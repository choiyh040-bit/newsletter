"use client";

import { useRef, useState } from "react";
import {
  MAX_SLIDES,
  linesToMarkup,
  parseLines,
  type CardNews,
  type CardSlide,
} from "@/lib/cardnews";

/**
 * 생성 결과를 사람이 손보는 편집기.
 *
 * 모델이 쓴 문장은 대체로 쓸 만하지만 그대로 올릴 만하지는 않다. 게시 전에
 * 사람이 한 번 손대는 자리가 없으면, 조금만 어긋나도 처음부터 다시 생성해야
 * 한다. 20~40초를 다시 쓰는 것보다 한 글자 고치는 쪽이 낫다.
 *
 * **글자와 줄바꿈과 강조를 한 칸에서 다룬다.** 줄바꿈 하나가 카드의 한 줄이
 * 되고, 강조는 `*별표*` 와 `==등호==` 표시로 건다. 줄마다 입력칸을 따로
 * 두거나 강조를 버튼으로만 걸게 하면 칸이 잘게 쪼개져서, 문장을 고치다가
 * 줄을 옮기는 흔한 일이 번거로워진다.
 */

type Field = "heading" | "body" | "note";

/** 줄 수 상한. `normalizeCardNews` 가 잘라내는 값과 같아야 한다. */
function maxLinesOf(field: Field, isCover: boolean): number {
  if (field === "heading") return isCover ? 5 : 3;
  if (field === "body") return isCover ? 2 : 4;
  return 2;
}

const FIELD_LABEL: Record<Field, string> = {
  heading: "헤드라인",
  body: "본문",
  note: "한 마디",
};

export default function SlideEditor({
  data,
  index,
  onChange,
  onAddSlide,
  onDeleteSlide,
}: {
  data: CardNews;
  /** 지금 보고 있는 장 */
  index: number;
  onChange: (next: CardNews) => void;
  onAddSlide: () => void;
  onDeleteSlide: () => void;
}) {
  const slide = data.slides[index];
  const isCover = slide.kind === "cover";
  const isDetail = slide.kind === "detail";

  // 강조 버튼이 "지금 고르고 있는 글자"를 알아야 해서 입력칸을 들고 있는다.
  const areas = useRef<Partial<Record<Field, HTMLTextAreaElement | null>>>({});

  /**
   * 줄 상한에 걸린 칸.
   *
   * 상한을 넘긴 줄을 조용히 잘라 내면, 치는 사람 입장에서는 방금 친 줄이
   * 그냥 사라진다. 막힌 것이 아니라 고장 난 것처럼 보인다. 넘긴 입력은
   * 받지 않되 **왜 안 되는지 말해 준다.**
   */
  const [blocked, setBlocked] = useState<Partial<Record<Field, boolean>>>({});

  const patchSlide = (patch: Partial<CardSlide>) => {
    onChange({
      ...data,
      slides: data.slides.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    });
  };

  const setField = (field: Field, text: string) => {
    const max = maxLinesOf(field, isCover);
    const asked = text.split("\n").filter((l) => l.trim()).length;
    if (asked > max) {
      setBlocked((b) => ({ ...b, [field]: true }));
      return; // 넘긴 입력은 반영하지 않는다. 앞의 내용이 그대로 남는다.
    }
    setBlocked((b) => (b[field] ? { ...b, [field]: false } : b));
    patchSlide({ [field]: parseLines(text, max) });
  };

  /** 고른 글자를 표시로 감싼다. 고른 것이 없으면 아무것도 하지 않는다. */
  const wrap = (field: Field, token: string) => {
    const area = areas.current[field];
    if (!area) return;
    const { selectionStart: a, selectionEnd: b, value } = area;
    if (a === b) return;

    const picked = value.slice(a, b);
    // 이미 같은 표시가 붙어 있으면 벗긴다. 버튼을 한 번 더 누르면 풀리는
    // 편이 자연스럽다.
    const already = picked.startsWith(token) && picked.endsWith(token);
    const next = already
      ? value.slice(0, a) + picked.slice(token.length, -token.length) + value.slice(b)
      : value.slice(0, a) + token + picked + token + value.slice(b);

    setField(field, next);
    // 고쳐 쓴 뒤에도 고른 자리를 유지한다.
    requestAnimationFrame(() => {
      area.focus();
      const shift = already ? -token.length : token.length;
      area.setSelectionRange(a + Math.max(shift, 0), b + shift * (already ? 1 : 1));
    });
  };

  const fields: Field[] = isDetail ? ["heading", "body", "note"] : ["heading", "body"];

  return (
    <div className="glass-panel p-5 rounded-2xl space-y-5">
      <div className="flex items-center justify-between">
        <h4 className="text-white font-korean-bold text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-sm">edit</span>
          {index + 1}번 장 고치기
        </h4>
        <span className="text-white/35 text-xs">
          {slide.kind === "cover" ? "표지" : slide.kind === "outro" ? "마무리" : "상세"}
        </span>
      </div>

      {/* 배지와 소제목 */}
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-white/50 text-xs mb-1.5">배지</span>
          <input
            value={slide.badge}
            onChange={(e) => patchSlide({ badge: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-primary/50 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="block text-white/50 text-xs mb-1.5">
            소제목 {isCover ? "(표지 서명)" : isDetail ? "(장 설명)" : "(안 쓰임)"}
          </span>
          <input
            value={slide.sub}
            onChange={(e) => patchSlide({ sub: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-primary/50 focus:outline-none disabled:opacity-40"
            disabled={slide.kind === "outro"}
          />
        </label>
      </div>

      {fields.map((field) => {
        const text = linesToMarkup(slide[field]);
        const lines = text === "" ? 0 : text.split("\n").length;
        const max = maxLinesOf(field, isCover);
        return (
          <div key={field}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-white/50 text-xs">
                {FIELD_LABEL[field]}
                <span
                  className={
                    blocked[field] ? "text-amber-300 ml-1.5" : "text-white/30 ml-1.5"
                  }
                >
                  {lines} / {max}줄
                </span>
              </span>
              <span className="flex gap-1.5">
                <button
                  onClick={() => wrap(field, "*")}
                  title="고른 글자를 포인트 컬러로"
                  className="px-2 py-0.5 rounded text-xs border border-white/15 text-white/70 hover:bg-white/10 transition-colors"
                >
                  색
                </button>
                <button
                  onClick={() => wrap(field, "==")}
                  title="고른 글자에 형광펜"
                  className="px-2 py-0.5 rounded text-xs border border-white/15 text-white/70 hover:bg-white/10 transition-colors"
                >
                  형광펜
                </button>
              </span>
            </div>
            {blocked[field] && (
              <p className="text-amber-300 text-xs mb-1.5 font-korean-reg">
                이 칸은 최대 {max}줄입니다. 줄을 더 넣으려면 먼저 한 줄을 줄이세요.
              </p>
            )}
            <textarea
              ref={(el) => {
                areas.current[field] = el;
              }}
              value={text}
              onChange={(e) => setField(field, e.target.value)}
              rows={Math.min(Math.max(lines, 2), 6)}
              spellCheck={false}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm leading-relaxed focus:border-primary/50 focus:outline-none resize-y font-korean-reg"
            />
          </div>
        );
      })}

      <p className="text-white/30 text-xs leading-relaxed font-korean-reg">
        줄바꿈 하나가 카드의 한 줄입니다.
        글자를 고른 뒤 위 버튼을 누르면 강조가 걸립니다
        (<span className="text-white/50">*색*</span>,{" "}
        <span className="text-white/50">==형광펜==</span>).
      </p>

      {/* 장 추가·삭제 */}
      <div className="flex gap-3 pt-1">
        <button
          onClick={onAddSlide}
          disabled={data.slides.length >= MAX_SLIDES}
          className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/80 text-sm hover:bg-white/5 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
        >
          뒤에 장 추가
        </button>
        <button
          onClick={onDeleteSlide}
          disabled={data.slides.length <= 2}
          className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 text-sm hover:bg-red-500/10 hover:text-red-300 hover:border-red-400/30 transition-colors disabled:opacity-30"
        >
          이 장 삭제
        </button>
      </div>
      <p className="text-white/25 text-xs font-korean-reg">
        최대 {MAX_SLIDES}장입니다. 첫 장은 표지, 마지막 장은 마무리로 그려집니다.
      </p>
    </div>
  );
}
