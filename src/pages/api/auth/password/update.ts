import type { APIRoute } from "astro";
import { supabaseClient } from "@/db/supabase.client";
import { AuthService } from "@/lib/services/auth.service";
import type { PasswordUpdateRequestDTO, SuccessMessageResponseDTO, ErrorResponseDTO } from "@/types";
import { passwordUpdateRequestSchema } from "@/lib/services/auth.zod";
import { ZodError } from "zod";

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse request body
    const body = (await request.json()) as PasswordUpdateRequestDTO;

    // Validate input data
    const validated = passwordUpdateRequestSchema.parse(body);

    // Initialize auth service
    const authService = new AuthService(supabaseClient);

    // Update password with reset token
    await authService.updatePassword(validated.token, validated.password);

    const response: SuccessMessageResponseDTO = {
      message: "Password updated successfully",
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

    // Handle specific errors
    const error = err as Error;

    if (error.message.includes("Invalid reset token")) {
      return new Response(
        JSON.stringify({
          error: {
            code: "INVALID_RESET_TOKEN",
            message: "The provided reset token is invalid or has expired",
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

    if (error.message.includes("Failed to update password")) {
      return new Response(
        JSON.stringify({
          error: {
            code: "PASSWORD_UPDATE_FAILED",
            message: "Failed to update password. Please ensure your new password meets security requirements",
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

    // Handle other errors
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred while updating password",
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
