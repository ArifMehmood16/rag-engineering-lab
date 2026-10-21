import { useCallback, useEffect, useState } from "react";

// Browser-local persistence. Gracefully degrades when storage is unavailable.
const EVENT = "aemp-storage";
export const STORAGE_PREFIX = "aemp:";

export function storageAvailable(): boolean {
  try {
    const k = "__aemp_test";
    window.localStorage.setItem(k, "1");
    window.localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function useLocalState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    setAvailable(storageAvailable());
    setValue(read(key, initial));
    const onChange = (e: Event) => {
      if ((e as CustomEvent).detail === key || (e as CustomEvent).detail === "*") setValue(read(key, initial));
    };
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const v = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(v));
          queueMicrotask(() => window.dispatchEvent(new CustomEvent(EVENT, { detail: key })));
        } catch {
          /* storage unavailable: keep in memory only */
        }
        return v;
      });
    },
    [key],
  );

  return [value, update, available] as const;
}

/** Progress = list of completed lesson slugs. */
export function useProgress() {
  const [completed, setCompleted, available] = useLocalState<string[]>("progress", []);
  const toggle = (slug: string, done: boolean) =>
    setCompleted((prev) => (done ? [...new Set([...prev, slug])] : prev.filter((s) => s !== slug)));
  return { completed, toggle, available };
}

export function resetAllLocalData() {
  try {
    Object.keys(window.localStorage)
      .filter((k) => k.startsWith(STORAGE_PREFIX))
      .forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: "*" }));
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
