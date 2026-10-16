"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CARD_HEIGHT, CARD_WIDTH, normalizeCardNews } from "@/lib/cardnews";
import {
  chooseAlign,
  chooseCustomAccent,
  chooseTemplate,
  chooseVariant,
  useDesignChoice,
} from "@/lib/cardNewsStore";
import AccentPicker from "./AccentPicker";
import {
  ALIGN_LABEL,
  availableTemplates,
  DEFAULT_ALIGN,
  type TextAlign,
  needsPhoto,
  resolveColors,
  templateById,
  TEMPLATES,
} from "@/lib/templates";

/** 넘칠 때 더 있는 쪽 끝을 흐리게. */
function scrollMask(s: { overflow: boolean; atStart: boolean; atEnd: boolean }): string | undefined {
  if (!s.overflow) return undefined;
  const left = s.atStart ? "black 0" : "transparent 0, black 28px";
  const right = s.atEnd ? "black 100%" : "black calc(100% - 48px), transparent 100%";
  return `linear-gradient(to right, ${left}, ${right})`;
}

/** 미리보기 한 장의 가로 폭(px). 세로는 4:5 로 따라간다. */
const THUMB_WIDTH = 104;
const SCALE = THUMB_WIDTH / CARD_WIDTH;

/** 생성 전에는 사진이 없으므로 사진 배경 템플릿은 보여만 주고 못 고른다. */
const USABLE = new Set(availableTemplates().map((t) => t.id));

/**
 * 사진 템플릿 견본에 깔 그림. 실제 사진은 생성할 때 기사에 맞춰 찾으므로,
 * 여기서는 "사진이 깔린다"는 것만 보여 주는 그림을 쓴다(저장소에 있는 SVG).
 */
const SAMPLE_PHOTO = { url: "/sample-photo.svg", credit: "견본", source: "upload" as const };

/**
 * 미리보기에 그릴 견본 표지.
 *
 * 그림 파일을 따로 두지 않고 **실제 템플릿 컴포넌트로 그린다.** 템플릿을
 * 목록(`src/lib/templates/index.ts`)에 한 줄 추가하면 여기에도 저절로 나온다.
 * 그림을 따로 만들면 템플릿을 고칠 때마다 그림이 낡는다.
 */
const SAMPLE = normalizeCardNews({
  title: "견본",
  accent: "#1a3a5c",
  slides: [
    {
      kind: "cover",
      badge: "MICE 뉴스",
      sub: "국제회의 유치",
      heading: ["국제회의에", "==210억 원==", "투입한다"],
      body: [],
    },
  ],
  caption: "",
  hashtags: [],
  source: { name: "견본", url: "" },
});

/**
 * 홈에서 생성 전에 카드 디자인을 고른다.
 *
 * 고른 것은 브라우저에 기억해서 다음에도 그대로 선택돼 있다. 생성한 뒤
 * 미리보기에서 바꾸는 것도 그대로 된다(다시 생성하지 않는다).
 * 강조색을 가진 템플릿이면 아래에 강조색 고르기가, 정렬을 고를 수 있는
 * 템플릿이면 좌측/중앙 고르기가 붙는다. 견본에 바로 반영된다.
 */
export default function TemplatePicker() {
  const design = useDesignChoice();
  const selected = templateById(design.templateId);
  /** 템플릿마다 그릴 색. 견본에도 고른 강조색이 그대로 보이게 한다. */
  const colorsFor = (t: typeof selected) =>
    resolveColors(t, design.variantId, design.customAccents?.[t.id]);
  const align: TextAlign = design.align ?? DEFAULT_ALIGN;
  const hasAccent = !!selected.variants && selected.variants.length > 0;

  // 가로 넘김 상태: 넘치는지, 양 끝에 닿았는지.
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = useState({ overflow: false, atStart: true, atEnd: false });
  const measureScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const overflow = el.scrollWidth > el.clientWidth + 4;
    setScroll({
      overflow,
      atStart: el.scrollLeft <= 4,
      atEnd: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
    });
  }, []);
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    // 크기가 바뀔 때(처음 그릴 때 포함) 다시 잰다. 콜백 안에서 재므로 렌더 중 상태 변경이 아니다.
    const ro = new ResizeObserver(measureScroll);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measureScroll]);
  // 지난번에 고른 디자인이 오른쪽 끝에 있으면 처음부터 보이게 끌어온다.
  // scrollIntoView 는 화면 전체까지 위아래로 움직여서(고르기가 화면 아래에 있으면 첫 화면이
  // 내려간다) 줄만 가로로 옮긴다.
  useEffect(() => {
    const box = scrollerRef.current;
    const el = box?.querySelector<HTMLElement>('[role="radio"][aria-checked="true"]');
    if (!box || !el) return;
    const target = el.offsetLeft - (box.clientWidth - el.offsetWidth) / 2;
    if (target > 0) box.scrollLeft = target;
  }, [selected.id]);

  return (
    <div className="mt-6">
      <p className="text-white/50 text-xs font-korean-reg mb-3 text-center">
        카드 디자인 · {TEMPLATES.length}가지
        {/* 화면 밖에 카드가 더 있을 때만. 처음 온 사람은 보이는 두세 개가 전부인 줄 알았다. */}
        {scroll.overflow && <span className="text-primary/80"> · 옆으로 넘겨 보세요 →</span>}
      </p>
      {/* 개수가 늘면 가로로 넘겨 본다. 한가운데 정렬은 넘칠 때 왼쪽이 잘리므로
          안쪽 줄을 w-max + mx-auto 로 가운데 둔다. 더 있는 쪽 끝은 흐리게(mask) 해서
          뒤에 더 있다는 것을 보여 준다. 마우스로는 밀기 어려워 넓은 화면에는 ‹ › 단추. */}
      <div className="relative">
      <div
        ref={scrollerRef}
        onScroll={measureScroll}
        className="overflow-x-auto pb-2 -mx-2 px-2"
        style={{ maskImage: scrollMask(scroll), WebkitMaskImage: scrollMask(scroll) }}
      >
        <div className="flex gap-3 w-max mx-auto" role="radiogroup" aria-label="카드 디자인">
          {TEMPLATES.map((template) => {
            const Render = template.Render;
            const isSelected = template.id === selected.id;
            const disabled = !USABLE.has(template.id);
            return (
              <button
                key={template.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={template.name}
                disabled={disabled}
                onClick={() => chooseTemplate(template.id)}
                title={template.description}
                className={`flex flex-col items-center gap-2 p-1.5 rounded-xl border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "border-white/10 hover:border-white/30"
                }`}
              >
                <div
                  className="relative overflow-hidden rounded-lg pointer-events-none"
                  style={{ width: THUMB_WIDTH, height: CARD_HEIGHT * SCALE }}
                  aria-hidden
                >
                  {/* 홈은 낱말이 안 갈리게 줄바꿈 규칙을 바꿔 두었다(.ko-text). 카드는
                      미리보기 화면과 똑같이 그려야 하므로 기본값으로 되돌린다. */}
                  <div
                    style={{
                      transform: `scale(${SCALE})`,
                      transformOrigin: "top left",
                      width: CARD_WIDTH,
                      height: CARD_HEIGHT,
                      wordBreak: "normal",
                      overflowWrap: "normal",
                    }}
                  >
                    <Render
                      slide={SAMPLE.slides[0]}
                      accent={SAMPLE.accent}
                      total={5}
                      source={SAMPLE.source}
                      photo={template.background === "photo" ? SAMPLE_PHOTO : null}
                      variant={colorsFor(template)}
                      align={template.alignable ? align : DEFAULT_ALIGN}
                    />
                  </div>
                </div>
                <span
                  className={`text-[11px] font-korean-reg leading-tight text-center w-[104px] ${
                    isSelected ? "text-white" : "text-white/60"
                  }`}
                >
                  {template.name}
                  {disabled && needsPhoto(template) && (
                    <span className="block text-white/40">사진 필요</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {scroll.overflow &&
        (["left", "right"] as const).map((side) => {
          const atEdge = side === "left" ? scroll.atStart : scroll.atEnd;
          return (
            <button
              key={side}
              type="button"
              aria-label={side === "left" ? "이전 디자인 보기" : "다음 디자인 보기"}
              disabled={atEdge}
              onClick={() => scrollerRef.current?.scrollBy({ left: side === "left" ? -320 : 320, behavior: "smooth" })}
              className={`hidden md:flex absolute top-[38%] -translate-y-1/2 ${
                side === "left" ? "-left-5" : "-right-5"
              } w-9 h-9 rounded-full bg-surface/90 border border-white/15 items-center justify-center text-white/80 hover:bg-white/10 disabled:opacity-0 transition-opacity`}
            >
              <span className="material-symbols-outlined text-xl">{side === "left" ? "chevron_left" : "chevron_right"}</span>
            </button>
          );
        })}
      </div>

      {(hasAccent || selected.alignable) && (
        <div className="mt-4 max-w-sm mx-auto text-left glass-panel rounded-xl p-4 space-y-4">
          {hasAccent && (
            <AccentPicker
              template={selected}
              current={colorsFor(selected)}
              onPreset={(variantId) => chooseVariant(selected.id, variantId)}
              onCustom={(color) => chooseCustomAccent(selected.id, color)}
            />
          )}
          {selected.alignable && (
            <div>
              <span className="block text-white/70 text-xs font-korean-bold mb-2">정렬</span>
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="정렬">
                {(["left", "center"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={option === align}
                    onClick={() => chooseAlign(option)}
                    className={`py-2 rounded-lg border text-sm font-korean-reg transition-colors ${
                      option === align
                        ? "border-primary/50 bg-primary/10 text-white"
                        : "border-white/10 text-white/60 hover:bg-white/5"
                    }`}
                  >
                    {ALIGN_LABEL[option]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
