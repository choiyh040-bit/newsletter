"use client";

import Link from "next/link";
import { CARD_HEIGHT, CARD_WIDTH, slidePhoto } from "@/lib/cardnews";
import {
  deleteCardNews,
  MAX_ENTRIES,
  useCardNewsHistory,
  useIsHydrated,
  type CardNewsEntry,
} from "@/lib/cardNewsStore";
import { formatWhen } from "@/lib/formatWhen";
import { DEFAULT_ALIGN, resolveColors, templateById } from "@/lib/templates";

/** 목록 썸네일 폭(px). 휴대폰(360px)에서 두 장이 나란히 들어간다. */
const THUMB = 148;
const SCALE = THUMB / CARD_WIDTH;

/** 저장된 결과의 표지를 고른 디자인 그대로 작게 그린다. */
function CoverThumb({ entry }: { entry: CardNewsEntry }) {
  const template = templateById(entry.templateId);
  const Render = template.Render;
  const data = entry.data;
  const cover = data.slides[0];
  if (!cover) return null;
  return (
    <div className="relative overflow-hidden rounded-lg pointer-events-none" style={{ width: THUMB, height: CARD_HEIGHT * SCALE }} aria-hidden>
      <div
        style={{
          transform: `scale(${SCALE})`,
          transformOrigin: "top left",
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          // 페이지는 낱말이 안 갈리게 줄바꿈 규칙을 바꿔 두었다(.ko-text). 카드는 기본값으로.
          wordBreak: "normal",
          overflowWrap: "normal",
        }}
      >
        <Render
          slide={cover}
          accent={data.accent}
          total={data.slides.length}
          source={data.source}
          photo={template.background === "photo" ? slidePhoto(cover, data) : null}
          variant={resolveColors(template, entry.variantId, entry.customAccents?.[template.id])}
          align={entry.align ?? DEFAULT_ALIGN}
        />
      </div>
    </div>
  );
}

/**
 * 내 카드뉴스. 이 브라우저에 저장된 결과 목록(2026-10-16 사용자: "방금 만든 것도 페이지 넘어가면 못 본다").
 *
 * 결과는 원래부터 브라우저(localStorage)에 최대 `MAX_ENTRIES` 건 저장됐고 미리보기 아래 "최근 생성"에도
 * 보였다. 다만 미리보기를 벗어나면 돌아갈 입구가 없었다. 서버에 저장하지 않으므로 다른 기기에서는 안 보인다.
 */
export default function MyCards() {
  const history = useCardNewsHistory();
  const loaded = useIsHydrated();
  if (!loaded) return null;

  if (history.length === 0) {
    return (
      <div className="glass-panel p-6 text-center" data-my-empty>
        <p className="text-white/70 text-[15px] font-korean-reg mb-5">아직 이 브라우저에서 만든 카드뉴스가 없습니다.</p>
        <Link
          href="/"
          className="inline-block cta-gradient text-white px-6 py-2.5 rounded-full text-sm font-korean-bold hover:brightness-110 transition-all"
          style={{ color: "#fff" }}
        >
          카드뉴스 만들러 가기
        </Link>
      </div>
    );
  }

  const handleDelete = (item: CardNewsEntry) => {
    if (window.confirm(`"${item.keyword || item.data.title}" 결과를 지울까요? 되돌릴 수 없습니다.`)) {
      deleteCardNews(item.id);
    }
  };

  return (
    <>
      <p className="text-white/45 text-sm font-korean-reg mb-6">
        {history.length}건 · 이 브라우저에만 저장되며 최근 {MAX_ENTRIES}건까지 보관합니다. 브라우저 데이터를 지우면 함께
        지워지니, 필요한 카드는 내려받아 두세요.
      </p>
      <div className="flex flex-wrap gap-3" data-my-list>
        {history.map((item) => (
          <div key={item.id} style={{ width: THUMB }} data-my-item>
            <Link href={`/preview?id=${item.id}`} className="block group" style={{ textDecoration: "none" }}>
              <div className="ring-1 ring-white/10 group-hover:ring-primary/60 rounded-lg transition-shadow">
                <CoverThumb entry={item} />
              </div>
            </Link>
            {/* 지우기는 썸네일 위에 두면 카드의 쪽 번호를 가려서 제목 줄 옆에 둔다. */}
            <div className="flex items-start gap-1 mt-2">
              <Link href={`/preview?id=${item.id}`} className="flex-1 min-w-0" style={{ textDecoration: "none" }}>
                <span className="block text-white/85 text-sm font-korean-bold leading-snug line-clamp-2">
                  {item.keyword || item.data.title}
                </span>
                <span className="block mt-0.5 text-white/40 text-xs font-korean-reg">
                  {formatWhen(item.createdAt)} · {item.data.slides.length}장
                </span>
              </Link>
              <button
                onClick={() => handleDelete(item)}
                aria-label="이 결과 삭제"
                className="w-7 h-7 -mr-1 rounded-lg flex-shrink-0 flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-white/5 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
