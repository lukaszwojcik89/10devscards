import { useState, useEffect, useCallback, useRef } from "react";
import type { DashboardData, DashboardState } from "@/types";

// Cache dla danych dashboard
const dashboardCache = new Map<string, { data: DashboardData; timestamp: number }>();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minuty

/**
 * Custom hook zarządzający stanem dashboard i API calls z cachingiem
 */
export const useDashboard = () => {
  const [dashboardState, setDashboardState] = useState<DashboardState>({
    data: null,
    isLoading: true,
    error: null,
    lastRefresh: null,
    showWelcomeToast: false,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const initializedRef = useRef(false);

  const fetchDashboardData = useCallback(async (force = false): Promise<DashboardData | null> => {
    // Get token from localStorage for Authorization header
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

    if (!token) {
      throw new Error("No authentication token found");
    }

    // Sprawdź cache jeśli nie wymuszamy odświeżenia
    if (!force) {
      const cacheKey = `dashboard_${token}`;
      const cached = dashboardCache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }
    }

    // Anuluj poprzednie żądanie jeśli istnieje
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Utwórz nowy AbortController
    abortControllerRef.current = new AbortController();

    const response = await fetch("/api/dashboard", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      signal: abortControllerRef.current.signal,
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Clear tokens on unauthorized but don't redirect
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        }
        throw new Error("Session expired. Please log in again.");
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    // Zapisz do cache
    const cacheKey = `dashboard_${token}`;
    dashboardCache.set(cacheKey, {
      data: result.data,
      timestamp: Date.now(),
    });

    return result.data;
  }, []);

  const loadDashboard = useCallback(
    async (force = false) => {
      setDashboardState((prev) => ({
        ...prev,
        isLoading: prev.data === null || force,
        error: null,
      }));

      try {
        const data = await fetchDashboardData(force);
        if (data) {
          // Sprawdź czy toast był już wyświetlony w tej sesji
          const toastShownKey = `welcome_toast_shown_${new Date().toDateString()}`;
          const toastAlreadyShown =
            typeof window !== "undefined" ? localStorage.getItem(toastShownKey) === "true" : false;

          setDashboardState((prev) => {
            const isFirstLoad = !prev.lastRefresh;
            const shouldShowToast = isFirstLoad && !toastAlreadyShown;

            // Oznacz toast jako wyświetlony na dziś jeśli ma być pokazany
            if (shouldShowToast && typeof window !== "undefined") {
              localStorage.setItem(toastShownKey, "true");
            }

            return {
              ...prev,
              data,
              isLoading: false,
              error: null,
              lastRefresh: new Date(),
              showWelcomeToast: shouldShowToast,
            };
          });
        }
      } catch (error) {
        setDashboardState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd",
        }));
      }
    },
    [fetchDashboardData]
  );

  const refresh = useCallback(async () => {
    setDashboardState((prev) => ({
      ...prev,
      error: null,
    }));

    try {
      const data = await fetchDashboardData();
      if (data) {
        setDashboardState((prev) => ({
          ...prev,
          data,
          lastRefresh: new Date(),
          error: null,
        }));
      }
    } catch (error) {
      setDashboardState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Wystąpił błąd podczas odświeżania",
      }));
    }
  }, [fetchDashboardData]);

  const dismissWelcomeToast = useCallback(() => {
    setDashboardState((prev) => ({
      ...prev,
      showWelcomeToast: false,
    }));
  }, []);

  // Initial load on mount with prefetch check
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const prefetchedData = (window as Window & { __DASHBOARD_PREFETCH__?: DashboardData })?.__DASHBOARD_PREFETCH__;

    if (prefetchedData) {
      // Użyj prefetched data
      setDashboardState((prev) => ({
        ...prev,
        data: prefetchedData,
        isLoading: false,
        lastRefresh: new Date(),
      }));

      // Zapisz do cache
      const token = localStorage.getItem("access_token");
      if (token) {
        const cacheKey = `dashboard_${token}`;
        dashboardCache.set(cacheKey, {
          data: prefetchedData,
          timestamp: Date.now(),
        });
      }

      // Sprawdź toast
      const toastShownKey = `welcome_toast_shown_${new Date().toDateString()}`;
      const toastAlreadyShown = localStorage.getItem(toastShownKey) === "true";

      if (!toastAlreadyShown) {
        setDashboardState((prev) => ({
          ...prev,
          showWelcomeToast: true,
        }));
        localStorage.setItem(toastShownKey, "true");
      }

      // Usuń prefetched data
      delete (window as Window & { __DASHBOARD_PREFETCH__?: DashboardData }).__DASHBOARD_PREFETCH__;
    } else {
      // Normalny load jeśli nie ma prefetched data
      loadDashboard();
    }
  }, [loadDashboard]);

  // Auto-refresh on window focus
  useEffect(() => {
    const handleFocus = () => {
      if (dashboardState.lastRefresh) {
        const timeSinceRefresh = Date.now() - dashboardState.lastRefresh.getTime();
        // Refresh if more than 5 minutes since last refresh
        if (timeSinceRefresh > 5 * 60 * 1000) {
          refresh();
        }
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [dashboardState.lastRefresh, refresh]);

  return {
    dashboardData: dashboardState.data,
    isLoading: dashboardState.isLoading,
    error: dashboardState.error,
    lastRefresh: dashboardState.lastRefresh,
    showWelcomeToast: dashboardState.showWelcomeToast,
    refresh,
    dismissWelcomeToast,
    isRefreshing: dashboardState.isLoading && dashboardState.data !== null,
  };
};
