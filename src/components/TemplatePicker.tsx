"use client";

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

/** 미리보기 한 장의 가로 폭(px). 세로는 4:5 로 따라간다. */
const THUMB_WIDTH = 104;
const SCALE = THUMB_WIDTH / CARD_WIDTH;

/** 생성 전에는 사진이 없으므로 사진 배경 템플릿은 보여만 주고 못 고른다. */
const USABLE = new Set(availableTemplates(false).map((t) => t.id));

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

  return (
    <div className="mt-6">
      <p className="text-white/50 text-xs font-korean-reg mb-3 text-center">카드 디자인</p>
      {/* 개수가 늘면 가로로 넘겨 본다. 한가운데 정렬은 넘칠 때 왼쪽이 잘리므로
          안쪽 줄을 w-max + mx-auto 로 가운데 둔다. */}
      <div className="overflow-x-auto pb-2 -mx-2 px-2">
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
                      photo={null}
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
