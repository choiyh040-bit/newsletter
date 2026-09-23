"use client";

import { useSyncExternalStore } from "react";
import { normalizeCardNews, type CardNews } from "./cardnews";

/**
 * 생성한 카드뉴스를 브라우저에 보관한다.
 *
 * sessionStorage 를 쓰던 때는 새로고침 한 번에 결과가 사라졌다. 20~40초를
 * 들여 만든 것이 탭을 잘못 닫으면 없어지니, localStorage 로 옮겨 브라우저를
 * 껐다 켜도 남게 했다.
 *
 * 서버에 저장하지 않으므로 다른 기기나 다른 사람과는 공유되지 않는다.
 * 링크 공유가 필요해지면 그때는 데이터베이스가 필요하다.
 */

const KEY = "cardNewsHistory";

/** 보관할 최대 개수. 한 건이 대략 2~4KB 라 넉넉하다. */
const MAX_ENTRIES = 20;

export interface CardNewsEntry {
  id: string;
  keyword: string;
  createdAt: string;
  data: CardNews;
  /** 고른 카드 템플릿. 없으면 기본 템플릿으로 본다. */
  templateId?: string;
}

// ─── 저장소 읽고 쓰기 ────────────────────────────────────────────────────────

/**
 * localStorage 는 시크릿 창이나 사이트 데이터 차단 상태에서 접근만 해도
 * 예외를 던진다. 그런 환경에서도 생성 자체는 되어야 하므로 실패를 삼키고
 * 빈 목록으로 둔다.
 */
function readRaw(): string {
  try {
    return localStorage.getItem(KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function writeRaw(value: string): void {
  try {
    localStorage.setItem(KEY, value);
  } catch {
    // 용량이 찼거나 저장이 막힌 경우. 저장만 실패하고 화면은 그대로 둔다.
  }
}

function parseHistory(raw: string): CardNewsEntry[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (entry): entry is CardNewsEntry =>
          typeof entry === "object" &&
          entry !== null &&
          typeof entry.id === "string" &&
          typeof entry.data === "object" &&
          entry.data !== null
      )
      .flatMap((entry) => {
        // 강조 기능이 생기기 전에 저장한 결과는 줄이 그냥 문자열이다.
        // 꺼낼 때 한 번 더 정리해서 지금 형식으로 맞춘다. 정리조차 되지 않는
        // 것은 애초에 그릴 수 없는 값이므로 목록에서 뺀다.
        try {
          return [{ ...entry, data: normalizeCardNews(entry.data) }];
        } catch {
          return [];
        }
      });
  } catch {
    return [];
  }
}

// ─── 변경 알림 ───────────────────────────────────────────────────────────────

const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // 다른 탭에서 생성하거나 지운 것도 반영한다.
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY || e.key === null) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * useSyncExternalStore 는 값이 그대로면 매번 같은 객체를 돌려받아야 한다.
 * JSON.parse 는 호출할 때마다 새 배열을 만들기 때문에 원본 문자열이 같으면
 * 앞서 만든 결과를 재사용한다.
 */
let cache: { raw: string; value: CardNewsEntry[] } | null = null;

function getSnapshot(): CardNewsEntry[] {
  const raw = readRaw();
  if (!cache || cache.raw !== raw) {
    cache = { raw, value: parseHistory(raw) };
  }
  return cache.value;
}

const EMPTY: CardNewsEntry[] = [];

/** 서버에서는 localStorage 를 읽을 수 없으므로 빈 목록으로 그린다. */
const getServerSnapshot = () => EMPTY;

// ─── 바깥에서 쓰는 함수 ──────────────────────────────────────────────────────

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** 새 결과를 맨 앞에 저장하고 그 id 를 돌려준다. */
export function saveCardNews(keyword: string, data: CardNews): string {
  const entry: CardNewsEntry = {
    id: newId(),
    keyword,
    createdAt: new Date().toISOString(),
    data,
  };

  const next = [entry, ...parseHistory(readRaw())].slice(0, MAX_ENTRIES);
  writeRaw(JSON.stringify(next));
  notify();
  return entry.id;
}

/**
 * 고른 템플릿을 기억한다.
 *
 * 화면 상태로만 두면 다른 결과를 보다가 돌아올 때마다 기본값으로 되돌아간다.
 * 어떤 디자인으로 뽑을지는 결과에 붙은 선택이므로 함께 보관한다.
 */
export function setCardNewsTemplate(id: string, templateId: string): void {
  const next = parseHistory(readRaw()).map((entry) =>
    entry.id === id ? { ...entry, templateId } : entry
  );
  writeRaw(JSON.stringify(next));
  notify();
}

export function deleteCardNews(id: string): void {
  const next = parseHistory(readRaw()).filter((entry) => entry.id !== id);
  writeRaw(JSON.stringify(next));
  notify();
}

// ─── 훅 ──────────────────────────────────────────────────────────────────────

/** 보관 중인 목록. 최신이 앞이다. */
export function useCardNewsHistory(): CardNewsEntry[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * 하이드레이션이 끝났는지 알려준다.
 *
 * 서버 렌더 결과에는 localStorage 값이 없어서, 이걸 구분하지 않으면 보관된
 * 결과가 있는데도 "생성된 카드뉴스가 없습니다" 화면이 잠깐 스친다.
 */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
