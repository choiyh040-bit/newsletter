"use client";

import { useSyncExternalStore } from "react";
import type { CardNews, CardNewsMeta } from "./cardnews";

const DATA_KEY = "cardNewsData";
const META_KEY = "cardNewsMeta";

export interface StoredCardNews {
  data: CardNews | null;
  meta: CardNewsMeta | null;
}

const EMPTY: StoredCardNews = { data: null, meta: null };

/**
 * useSyncExternalStore 는 값이 바뀌지 않았으면 매번 같은 객체를 돌려받아야
 * 한다. JSON.parse 는 호출할 때마다 새 객체를 만들기 때문에, 원본 문자열이
 * 그대로면 앞서 만든 결과를 재사용한다.
 */
let cache: { raw: string; value: StoredCardNews } | null = null;

function parse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function getSnapshot(): StoredCardNews {
  const dataRaw = sessionStorage.getItem(DATA_KEY);
  const metaRaw = sessionStorage.getItem(META_KEY);
  const raw = `${dataRaw ?? ""} ${metaRaw ?? ""}`;

  if (!cache || cache.raw !== raw) {
    cache = {
      raw,
      value: { data: parse<CardNews>(dataRaw), meta: parse<CardNewsMeta>(metaRaw) },
    };
  }
  return cache.value;
}

/** 이 화면이 열려 있는 동안 저장된 값이 바뀌지 않으므로 구독할 것이 없다. */
const subscribe = () => () => {};

/** 서버에서는 sessionStorage 를 읽을 수 없으므로 빈 값으로 그린다. */
const getServerSnapshot = () => EMPTY;

export function useStoredCardNews(): StoredCardNews {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * 하이드레이션이 끝났는지 알려준다.
 *
 * 서버 렌더 결과에는 sessionStorage 값이 없어서, 이걸 구분하지 않으면
 * 데이터가 있는데도 "생성된 카드뉴스가 없습니다" 화면이 잠깐 스친다.
 */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
