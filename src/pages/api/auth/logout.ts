import type { APIRoute } from "astro";
import { supabaseClient } from "@/db/supabase.client";
import { AuthService } from "@/lib/services/auth.service";
import type { LogoutResponseDTO, ErrorResponseDTO } from "@/types";

export const POST: APIRoute = async ({ request }) => {
  try {
    // Extract Bearer token from Authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({
          error: {
            code: "MISSING_AUTHORIZATION",
            message: "Authorization header with Bearer token is required",
          },
        } as ErrorResponseDTO),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
          },
        }
      );
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Initialize auth service
    const authService = new AuthService(supabaseClient);

    // Logout user (invalidate session)
    await authService.logout(token);

    const response: LogoutResponseDTO = {
      message: "Logged out successfully",
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Set-Cookie": "access_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0",
      },
    });
  } catch {
    // For logout, we generally don't want to fail even if token is invalid
    // Return success anyway for security reasons
    const response: LogoutResponseDTO = {
      message: "Logged out successfully",
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Set-Cookie": "access_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0",
      },
    });
  }
};
