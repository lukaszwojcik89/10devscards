import type { APIRoute } from "astro";
import { supabaseClient } from "@/db/supabase.client";
import { AuthService } from "@/lib/services/auth.service";
import type { RefreshTokenRequestDTO, RefreshTokenResponseDTO, ErrorResponseDTO } from "@/types";
import { refreshTokenRequestSchema } from "@/lib/services/auth.zod";
import { ZodError } from "zod";

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse request body
    const body = (await request.json()) as RefreshTokenRequestDTO;

    // Validate input data
    const validated = refreshTokenRequestSchema.parse(body);

    // Initialize auth service
    const authService = new AuthService(supabaseClient);

    // Refresh access token
    const tokenData = await authService.refreshToken(validated.refresh_token);

    const response: RefreshTokenResponseDTO = {
      data: {
        access_token: tokenData.access_token,
        expires_in: tokenData.expires_in,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
      },
    });
  } catch (err) {
    // Handle validation errors
    if (err instanceof ZodError) {
      const details = err.errors.reduce(
        (acc, e) => ({
          ...acc,
          [e.path.join(".")]: e.message,
        }),
        {}
      );

      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request data",
            details,
          },
        } as ErrorResponseDTO),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
          },
        }
      );
    }

    // Handle refresh token errors
    const error = err as Error;

    if (error.message.includes("Invalid refresh token")) {
      return new Response(
        JSON.stringify({
          error: {
            code: "INVALID_REFRESH_TOKEN",
            message: "The provided refresh token is invalid or has expired",
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

    // Handle other errors
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred while refreshing token",
        },
      } as ErrorResponseDTO),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "DENY",
          "X-XSS-Protection": "1; mode=block",
        },
      }
    );
  }
};
