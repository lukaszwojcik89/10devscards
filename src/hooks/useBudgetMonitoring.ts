import { useState, useEffect, useCallback, useMemo } from "react";
import type { GenerationSettings, BudgetInfo, BudgetStatus } from "../types";

/**
 * Hook do monitorowania budżetu i kosztów generacji AI
 * Oblicza koszty w czasie rzeczywistym i pokazuje ostrzeżenia
 */
export function useBudgetMonitoring() {
  const [budgetInfo, setBudgetInfo] = useState<BudgetInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Pobiera aktualne informacje o budżecie z API
   */
  const fetchBudgetInfo = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Pobierz token z localStorage
      const token = localStorage.getItem("access_token");
      const headers: HeadersInit = { "Content-Type": "application/json" };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch("/api/budget", {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setBudgetInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nieznany błąd");
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Odświeża dane budżetu
   */
  const refreshBudget = useCallback(() => {
    fetchBudgetInfo();
  }, [fetchBudgetInfo]);

  /**
   * Oblicza przewidywany koszt generacji na podstawie ustawień
   */
  const calculateEstimatedCost = useCallback((settings: GenerationSettings): number => {
    // Koszt bazowy za kartę (w tokenach)
    const baseTokensPerCard = 50;

    // Modyfikatory trudności
    const difficultyMultiplier = {
      beginner: 0.8,
      intermediate: 1.0,
      advanced: 1.3,
    };

    // Modyfikator języka (języki inne niż angielski mogą być droższe)
    const languageMultiplier = settings.language === "en" ? 1.0 : 1.2;

    // Modyfikator kontekstu (dodatkowy tekst zwiększa koszt)
    const contextMultiplier = settings.context ? 1.3 : 1.0;

    const tokensPerCard =
      baseTokensPerCard * difficultyMultiplier[settings.difficulty] * languageMultiplier * contextMultiplier;

    const totalTokens = tokensPerCard * settings.maxCards;

    // Konwersja tokenów na koszt (przykładowo $0.002 za 1000 tokenów)
    return (totalTokens / 1000) * 0.002;
  }, []);

  /**
   * Sprawdza status budżetu na podstawie przewidywanego kosztu
   */
  const checkBudgetStatus = useCallback(
    (estimatedCost: number): BudgetStatus => {
      if (!budgetInfo) return "unknown";

      const remainingBudget = budgetInfo.monthlyLimit - budgetInfo.currentSpend;
      const afterGeneration = budgetInfo.currentSpend + estimatedCost;

      // Sprawdź różne progi ostrzeżeń
      if (estimatedCost > remainingBudget) {
        return "exceeded";
      }

      if (afterGeneration > budgetInfo.monthlyLimit * 0.9) {
        return "critical"; // 90%+ budżetu
      }

      if (afterGeneration > budgetInfo.monthlyLimit * 0.75) {
        return "warning"; // 75%+ budżetu
      }

      return "safe";
    },
    [budgetInfo]
  );

  /**
   * Sprawdza czy generacja może być wykonana
   */
  const canGenerate = useCallback(
    (estimatedCost: number): boolean => {
      if (!budgetInfo) return false;

      const remainingBudget = budgetInfo.monthlyLimit - budgetInfo.currentSpend;
      return estimatedCost <= remainingBudget;
    },
    [budgetInfo]
  );

  /**
   * Oblicza procent wykorzystania budżetu
   */
  const budgetUsagePercentage = useMemo(() => {
    if (!budgetInfo) return 0;
    return Math.round((budgetInfo.currentSpend / budgetInfo.monthlyLimit) * 100);
  }, [budgetInfo]);

  /**
   * Formatuje kwotę do wyświetlenia
   */
  const formatCurrency = useCallback((amount: number): string => {
    return new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(amount);
  }, []);

  /**
   * Pobiera dane przy pierwszym załadowaniu
   */
  useEffect(() => {
    fetchBudgetInfo();
  }, [fetchBudgetInfo]);

  return {
    // Stan budżetu
    budgetInfo,
    isLoading,
    error,
    budgetUsagePercentage,

    // Funkcje obliczeniowe
    calculateEstimatedCost,
    checkBudgetStatus,
    canGenerate,
    formatCurrency,

    // Akcje
    refreshBudget,
  };
}
