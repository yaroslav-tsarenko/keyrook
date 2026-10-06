"use client";

import { useSyncExternalStore } from "react";
import { cachedFetchJSON, readCached } from "@/lib/utils/reliable-fetch";

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  _count?: { products: number };
  productCount?: number;
  children?: CategoryNode[];
}

export function subtreeCount(cat: CategoryNode): number {
  if (typeof cat.productCount === "number") return cat.productCount;
  const own = cat._count?.products || 0;
  return own + (cat.children || []).reduce((sum, child) => sum + subtreeCount(child), 0);
}

const CACHE_KEY = "header:categories";
const EMPTY: CategoryNode[] = [];

let snapshot: CategoryNode[] = EMPTY;
let request: Promise<void> | null = null;
const listeners = new Set<() => void>();

function publish(next: CategoryNode[]) {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

function load() {
  if (request) return;
  const cached = readCached<CategoryNode[]>({ cacheKey: CACHE_KEY, storage: "session" });
  if (Array.isArray(cached) && snapshot === EMPTY) publish(cached);
  request = cachedFetchJSON<CategoryNode[]>("/api/categories", { cacheKey: CACHE_KEY, storage: "session" })
    .then((data) => {
      if (Array.isArray(data)) publish(data);
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

function subscribeNone() {
  return () => {};
}

const getSnapshot = () => snapshot;
const getServerSnapshot = () => EMPTY;

export function useCategoryTree(enabled = true): CategoryNode[] {
  return useSyncExternalStore(enabled ? subscribe : subscribeNone, enabled ? getSnapshot : getServerSnapshot, getServerSnapshot);
}

export function findCategory(categories: CategoryNode[], slug: string): CategoryNode | undefined {
  return categories.find((c) => c.slug === slug);
}

function containsSlug(node: CategoryNode, slug: string): boolean {
  return node.slug === slug || (node.children ?? []).some((child) => containsSlug(child, slug));
}

export function findRootSlug(categories: CategoryNode[], slug: string | null | undefined): string | null {
  if (!slug) return null;
  return categories.find((root) => containsSlug(root, slug))?.slug ?? null;
}

export function catalogSlugFromPath(pathname: string | null | undefined): string | null {
  const match = /^\/catalog\/([^/?#]+)/.exec(pathname ?? "");
  return match ? decodeURIComponent(match[1]) : null;
}
