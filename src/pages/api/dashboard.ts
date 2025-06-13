import type { APIRoute } from "astro";
import { supabaseClient } from "@/db/supabase.client";
import { DashboardService } from "../../lib/services/dashboard.service";
import type { ErrorResponseDTO } from "@/types";

/**
 * GET /api/dashboard - Get comprehensive dashboard data for authenticated user
 */
export const GET: APIRoute = async ({ request }) => {
  // Authentication check
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
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

  const token = authHeader.slice(7);
  const {
    data: { user },
    error: authError,
  } = await supabaseClient.auth.getUser(token);

  if (authError || !user) {
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

  const userId = user.id;

  try {
    const service = new DashboardService(supabaseClient);
    const result = await service.getDashboardData(userId);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
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
