import { useCallback, useEffect, useState } from "react";

/**
 * Tracks the last time the admin visited a given page key, and exposes
 * helpers to count how many items are "new" since then.
 *
 * Storage: localStorage[`admin:last-visit:${key}`] = ISO timestamp
 */
export function useNewSinceLastVisit(key: string) {
  const storageKey = `admin:last-visit:${key}`;
  const [lastVisit, setLastVisit] = useState<Date | null>(() => {
    if (typeof window === "undefined") return null;
    const v = window.localStorage.getItem(storageKey);
    return v ? new Date(v) : null;
  });

  /** Mark "now" as the new last-visit timestamp. */
  const markVisited = useCallback(() => {
    const now = new Date();
    window.localStorage.setItem(storageKey, now.toISOString());
    setLastVisit(now);
  }, [storageKey]);

  /** Count rows whose `created_at` is strictly after the previous last-visit. */
  const countNew = useCallback(
    <T extends { created_at?: string | null }>(rows: T[] | undefined | null) => {
      if (!rows?.length || !lastVisit) return 0;
      const ts = lastVisit.getTime();
      return rows.reduce((acc, r) => {
        if (!r.created_at) return acc;
        return new Date(r.created_at).getTime() > ts ? acc + 1 : acc;
      }, 0);
    },
    [lastVisit]
  );

  // Silence unused-import lint if React strict-mode tree-shakes useEffect
  useEffect(() => {}, []);

  return { lastVisit, markVisited, countNew };
}
