"use client";

import { CUSTOM_VARIANT_ID, type Template, type TemplateVariant } from "@/lib/templates";

interface Props {
  template: Template;
  /** 지금 그려지는 색(색 조합 + 직접 고른 색을 푼 결과). */
  current: TemplateVariant | null;
  onPreset: (variantId: string) => void;
  onCustom: (color: string) => void;
}

/**
 * 강조색 고르기. 홈(생성 전)과 미리보기(생성 후)가 같이 쓴다.
 *
 * 미리 정한 색 조합 견본에 더해 **직접 고르기**를 둔다. 견본만 있으면
 * 기관 상징색처럼 정해진 색을 쓸 수 없다. 직접 고른 색은 강조색만 바꾸고
 * 바탕은 지금 고른 견본의 바탕을 그대로 쓴다.
 *
 * 색 조합이 없는 템플릿에서는 아무것도 그리지 않는다.
 */
export default function AccentPicker({ template, current, onPreset, onCustom }: Props) {
  const presets = template.variants;
  if (!presets || presets.length === 0) return null;

  const isCustom = current?.id === CUSTOM_VARIANT_ID;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <span className="text-white/70 text-xs font-korean-bold">강조색</span>
        <span className="text-white/40 text-xs">{current?.name}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {presets.map((option) => {
          const isCurrent = !isCustom && option.id === current?.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onPreset(option.id)}
              title={option.name}
              aria-label={option.name}
              aria-pressed={isCurrent}
              className={`w-9 h-9 rounded-full border transition-transform hover:scale-110 ${
                isCurrent ? "border-white/70 scale-110" : "border-white/15"
              }`}
              style={{ background: option.base }}
            >
              <span
                className="block w-3.5 h-3.5 rounded-full mx-auto"
                style={{ background: option.neon }}
              />
            </button>
          );
        })}

        {/* 직접 고르기. 브라우저 기본 색상 선택기를 쓴다. 휴대폰에서도
            그 기기의 선택기가 뜬다. 무지개 테두리로 "아무 색이나"를 알린다. */}
        <label
          title="강조색 직접 고르기"
          className={`relative w-9 h-9 rounded-full border cursor-pointer transition-transform hover:scale-110 flex items-center justify-center ${
            isCustom ? "border-white/70 scale-110" : "border-white/15"
          }`}
          style={{
            background: isCustom
              ? current!.base
              : "conic-gradient(#ff2d78, #ffd400, #b8ff2e, #25e0f0, #1f4fe0, #9b5cff, #ff2d78)",
          }}
        >
          {isCustom ? (
            <span
              className="block w-3.5 h-3.5 rounded-full"
              style={{ background: current!.neon }}
            />
          ) : (
            <span className="material-symbols-outlined text-white text-[16px] drop-shadow">
              colorize
            </span>
          )}
          <input
            type="color"
            aria-label="강조색 직접 고르기"
            className="absolute inset-0 opacity-0 cursor-pointer"
            value={current?.neon ?? "#ff2d78"}
            onChange={(e) => onCustom(e.target.value)}
          />
        </label>
      </div>
    </div>
  );
}
