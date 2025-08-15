import { useCallback, useRef } from "react";
import type { DashboardData } from "@/types";

interface CacheEntry {
  data: DashboardData;
  timestamp: number;
}

const CACHE_DURATION = 2 * 60 * 1000; // 2 minuty
const cache = new Map<string, CacheEntry>();

/**
 * Hook do zarządzania cache'em dashboard data
 */
export const useDashboardCache = () => {
  const cleanupTimerRef = useRef<NodeJS.Timeout>();

  const getCacheKey = useCallback((token: string) => `dashboard_${token}`, []);

  // Przenieś cleanup poza useCallback aby uniknąć cyklicznej zależności
  const cleanupExpired = () => {
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
      if (now - entry.timestamp > CACHE_DURATION) {
        cache.delete(key);
      }
    }
  };

  const get = useCallback(
    (token: string): DashboardData | null => {
      const key = getCacheKey(token);
      const entry = cache.get(key);

      if (!entry) return null;

      const now = Date.now();
      if (now - entry.timestamp > CACHE_DURATION) {
        cache.delete(key);
        return null;
      }

      return entry.data;
    },
    [getCacheKey]
  );

  const set = useCallback(
    (token: string, data: DashboardData) => {
      const key = getCacheKey(token);
      cache.set(key, {
        data,
        timestamp: Date.now(),
      });

      // Ustaw cleanup timer
      if (cleanupTimerRef.current) {
        clearTimeout(cleanupTimerRef.current);
      }

      cleanupTimerRef.current = setTimeout(() => {
        cleanupExpired();
      }, CACHE_DURATION);
    },
    [getCacheKey]
  );

  const clear = useCallback(() => {
    cache.clear();
    if (cleanupTimerRef.current) {
      clearTimeout(cleanupTimerRef.current);
    }
  }, []);

  return {
    get,
    set,
    clear,
    cleanupExpired,
  };
};
