"use client";

import { useCallback, useEffect, useState } from "react";

export function useAccountData<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch(url, { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        return (await res.json()) as T;
      })
      .then((value) => {
        if (!cancelled) setData(value);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [url, tick]);

  const reload = useCallback(() => {
    setLoading(true);
    setError(false);
    setTick((n) => n + 1);
  }, []);
  const refresh = useCallback(() => setTick((n) => n + 1), []);
  return { data, error, loading, reload, refresh, setData };
}
