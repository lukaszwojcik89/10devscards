import type { APIRoute } from "astro";
import { supabaseClient } from "@/db/supabase.client";
import { AuthService } from "@/lib/services/auth.service";
import type { PasswordResetRequestDTO, PasswordResetResponseDTO, ErrorResponseDTO } from "@/types";
import { passwordResetRequestSchema } from "@/lib/services/auth.zod";
import { ZodError } from "zod";

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse request body
    const body = (await request.json()) as PasswordResetRequestDTO;

    // Validate input data
    const validated = passwordResetRequestSchema.parse(body);

    // Initialize auth service
    const authService = new AuthService(supabaseClient);

    // Request password reset (always returns success for security)
    await authService.requestPasswordReset(validated.email);

    const response: PasswordResetResponseDTO = {
      message: "If an account with this email exists, you will receive password reset instructions",
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

    // For security, always return success message even on errors
    const response: PasswordResetResponseDTO = {
      message: "If an account with this email exists, you will receive password reset instructions",
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
  }
};
