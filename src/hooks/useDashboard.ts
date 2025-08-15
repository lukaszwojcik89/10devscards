import { useState, useEffect, useCallback } from "react";
import type { DashboardData, DashboardState } from "@/types";

/**
 * Custom hook zarządzający stanem dashboard i API calls
 */
export const useDashboard = () => {
  const [dashboardState, setDashboardState] = useState<DashboardState>({
    data: null,
    isLoading: true,
    error: null,
    lastRefresh: null,
    showWelcomeToast: false,
  });

  const fetchDashboardData = useCallback(async (): Promise<DashboardData | null> => {
    // Get token from localStorage for Authorization header
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

    if (!token) {
      // Don't redirect automatically, let parent component handle auth
      throw new Error("No authentication token found");
    }

    const response = await fetch("/api/dashboard", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
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
    return result.data;
  }, []);

  const loadDashboard = useCallback(async () => {
    setDashboardState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const data = await fetchDashboardData();
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
  }, [fetchDashboardData]);

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

  // Initial load on mount
  useEffect(() => {
    loadDashboard();
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
