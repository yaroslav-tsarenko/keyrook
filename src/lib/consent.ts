"use client";

import { useSyncExternalStore } from "react";

export const CONSENT_KEY = "keyrook-consent";
export const CONSENT_VERSION = 1;
export const CONSENT_MAX_AGE_DAYS = 365;

const CHANGE_EVENT = "keyrook:consent-change";
const OPEN_EVENT = "keyrook:cookie-settings";

export type OptionalConsent = "analytics" | "marketing";

export interface ConsentState {
  version: number;
  timestamp: string;
  necessary: true;
  analytics: boolean;
  marketing: boolean;
}

let cachedRaw: string | null | undefined;
let cachedValue: ConsentState | null = null;

function parse(raw: string | null): ConsentState | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as ConsentState;
    if (value.version !== CONSENT_VERSION) return null;
    const age = Date.now() - new Date(value.timestamp).getTime();
    if (!Number.isFinite(age) || age > CONSENT_MAX_AGE_DAYS * 86400000) return null;
    return { version: value.version, timestamp: value.timestamp, necessary: true, analytics: Boolean(value.analytics), marketing: Boolean(value.marketing) };
  } catch {
    return null;
  }
}

export function readConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(CONSENT_KEY);
  } catch {
    raw = null;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedValue = parse(raw);
  }
  return cachedValue;
}

export function writeConsent(choice: { analytics: boolean; marketing: boolean }): ConsentState {
  const value: ConsentState = {
    version: CONSENT_VERSION,
    timestamp: new Date().toISOString(),
    necessary: true,
    analytics: choice.analytics,
    marketing: choice.marketing,
  };
  try {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(value));
  } catch {}
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: value }));
  return value;
}

export function hasConsent(category: OptionalConsent): boolean {
  return Boolean(readConsent()?.[category]);
}

export function openCookieSettings() {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT));
}

export function onOpenCookieSettings(handler: () => void) {
  window.addEventListener(OPEN_EVENT, handler);
  return () => window.removeEventListener(OPEN_EVENT, handler);
}

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === CONSENT_KEY) onChange();
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function useConsent(): { consent: ConsentState | null; ready: boolean } {
  const consent = useSyncExternalStore(subscribe, readConsent, () => null);
  const ready = useSyncExternalStore(subscribe, () => true, () => false);
  return { consent, ready };
}
