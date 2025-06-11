import type { APIRoute } from "astro";
import { supabaseClient } from "@/db/supabase.client";
import { AuthService } from "@/lib/services/auth.service";
import type { RegisterRequestDTO, ErrorResponseDTO } from "@/types";
import { ZodError } from "zod";

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse request body
    const body = (await request.json()) as RegisterRequestDTO;

    // Initialize auth service
    const authService = new AuthService(supabaseClient);

    // Attempt registration
    const result = await authService.register(body);

    return new Response(JSON.stringify(result), {
      status: 201,
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
            message: "Invalid input data",
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

    const message = (err as Error).message;

    // Handle email already exists
    if (message.includes("already exists") || message.includes("already registered")) {
      return new Response(
        JSON.stringify({
          error: {
            code: "EMAIL_EXISTS",
            message: "Użytkownik z tym adresem email już istnieje",
          },
        } as ErrorResponseDTO),
        {
          status: 409,
          headers: {
            "Content-Type": "application/json",
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
          },
        }
      );
    }

    // Handle rate limiting
    if (message.includes("Too many requests")) {
      return new Response(
        JSON.stringify({
          error: {
            code: "TOO_MANY_REQUESTS",
            message: "Zbyt wiele prób rejestracji. Spróbuj ponownie później",
            details: {
              retry_after: 900, // 15 minutes
            },
          },
        } as ErrorResponseDTO),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "900",
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
          },
        }
      );
    }

    // Generic server error
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: "Usługa rejestracji tymczasowo niedostępna",
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
