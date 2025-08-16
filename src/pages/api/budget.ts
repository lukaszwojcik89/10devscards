import type { APIRoute } from "astro";
import type { BudgetInfo } from "../../types";

/**
 * API endpoint dla informacji o budżecie użytkownika
 * GET /api/budget - pobiera aktualne informacje o budżecie
 */
export const GET: APIRoute = async ({ request: _request }) => {
  try {
    // Mock data - w rzeczywistości pobrać z bazy danych na podstawie userId
    const mockBudgetInfo: BudgetInfo = {
      currentSpend: 2.5, // Dotychczasowe wydatki w tym miesiącu
      monthlyLimit: 10, // Miesięczny limit budżetu
      usagePercentage: 25, // 25% wykorzystania budżetu
      estimatedCost: 0, // Będzie obliczone dynamicznie w UI
      warningThreshold: 0.8, // 80% - próg ostrzeżenia
      isBlocked: false, // Czy przekroczono 100% budżetu
    };

    return new Response(JSON.stringify(mockBudgetInfo), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch {
    return new Response(
      JSON.stringify({
        error: "Failed to fetch budget information",
        code: "BUDGET_FETCH_ERROR",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
