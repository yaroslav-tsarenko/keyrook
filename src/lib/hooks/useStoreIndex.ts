"use client";

import { useSyncExternalStore } from "react";
import { cachedFetchJSON, readCached } from "@/lib/utils/reliable-fetch";
import type { StoreIndex } from "@/lib/catalog/store-index";

const CACHE_KEY = "store-index:v1";

let snapshot: StoreIndex | null = null;
let request: Promise<void> | null = null;
const listeners = new Set<() => void>();

function publish(next: StoreIndex) {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

function valid(data: unknown): data is StoreIndex {
  return Boolean(data && typeof data === "object" && Array.isArray((data as StoreIndex).platforms));
}

function load() {
  if (request) return;
  const cached = readCached<StoreIndex>({ cacheKey: CACHE_KEY, storage: "session" });
  if (valid(cached) && !snapshot) publish(cached);
  request = cachedFetchJSON<StoreIndex>("/api/store-index", { cacheKey: CACHE_KEY, storage: "session" })
    .then((data) => {
      if (valid(data)) publish(data);
    })
    .catch(() => {
      request = null;
    });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  load();
  return () => {
    listeners.delete(listener);
  };
}

export function useStoreIndex(): StoreIndex | null {
  return useSyncExternalStore(subscribe, () => snapshot, () => null);
}

export function searchCountLabel(total: number | null | undefined): string {
  if (!total) return "Search keys";
  const shown = total > 1000 ? Math.floor(total / 10) * 10 : total;
  return `Search ${shown.toLocaleString("en-GB")} keys`;
}
