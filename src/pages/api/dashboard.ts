import type { APIRoute } from "astro";
import { supabaseClient } from "@/db/supabase.client";
import { DashboardService } from "../../lib/services/dashboard.service";
import { AuthService } from "../../lib/services/auth.service";
import type { ErrorResponseDTO } from "@/types";

/**
 * GET /api/dashboard - Get comprehensive dashboard data for authenticated user
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    // Extract Bearer token from Authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message: "Unauthorized",
          },
        } as ErrorResponseDTO),
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Initialize auth service and verify token
    const authService = new AuthService(supabaseClient);
    const userProfile = await authService.getCurrentUser(token);

    // Initialize dashboard service
    const dashboardService = new DashboardService(supabaseClient);
    const result = await dashboardService.getDashboardData(userProfile.id);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    // Handle authentication errors
    const error = err as Error;

    if (error.message.includes("Invalid or expired token")) {
      return new Response(
        JSON.stringify({
          error: {
            code: "INVALID_TOKEN", // This code triggers logout
            message: "Unauthorized",
          },
        } as ErrorResponseDTO),
        { status: 401 }
      );
    }

    // Log error for debugging but don't expose details
    // eslint-disable-next-line no-console
    console.error("Dashboard endpoint error:", err);
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Internal server error",
        },
      } as ErrorResponseDTO),
      { status: 500 }
    );
  }
};
