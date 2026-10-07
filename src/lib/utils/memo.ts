export function memoize<T>(ttlMs: number, load: () => Promise<T>, options: { staleMs?: number } = {}): () => Promise<T> {
  let entry: { value: Promise<T>; at: number; settled: boolean } | null = null;
  let refreshing: Promise<T> | null = null;
  const start = () => {
    const value = load();
    const next = { value, at: Date.now(), settled: false };
    value.then(
      () => {
        next.settled = true;
        entry = next;
      },
      () => {
        if (entry === next) entry = null;
      },
    );
    return { next, value };
  };
  return () => {
    const age = entry ? Date.now() - entry.at : Infinity;
    if (entry && age < ttlMs) return entry.value;
    if (entry && entry.settled && age < ttlMs + (options.staleMs ?? 0)) {
      if (!refreshing) {
        const { value } = start();
        refreshing = value.finally(() => {
          refreshing = null;
        });
        refreshing.catch(() => {});
      }
      return entry.value;
    }
    const { next, value } = start();
    entry = next;
    return value;
  };
}

export function memoizeByKey<T>(ttlMs: number, options: { staleMs?: number; max?: number } = {}): (key: string, load: () => Promise<T>) => Promise<T> {
  const max = options.max ?? 200;
  const entries = new Map<string, () => Promise<T>>();
  return (key, load) => {
    let get = entries.get(key);
    if (get) entries.delete(key);
    else get = memoize(ttlMs, load, { staleMs: options.staleMs });
    entries.set(key, get);
    while (entries.size > max) entries.delete(entries.keys().next().value!);
    return get();
  };
}
