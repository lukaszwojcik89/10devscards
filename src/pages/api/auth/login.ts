import type { APIRoute } from "astro";
import { supabaseClient } from "@/db/supabase.client";
import { AuthService } from "@/lib/services/auth.service";
import type { LoginRequestDTO, ErrorResponseDTO } from "@/types";
import { ZodError } from "zod";

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse request body
    const body = (await request.json()) as LoginRequestDTO;

    // Initialize auth service
    const authService = new AuthService(supabaseClient);

    // Attempt login
    const result = await authService.login(body);

    // Set HTTP-only cookie for access token
    const response = new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Set-Cookie": `access_token=${result.data.access_token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${result.data.expires_in}`,
      },
    });

    return response;
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

    // Handle authentication errors
    if (message.includes("Invalid credentials")) {
      return new Response(
        JSON.stringify({
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password",
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

    // Handle unconfirmed email
    if (message.includes("Email not confirmed")) {
      return new Response(
        JSON.stringify({
          error: {
            code: "EMAIL_NOT_CONFIRMED",
            message: "Please confirm your email address before logging in",
          },
        } as ErrorResponseDTO),
        {
          status: 401, // Zmiana z 403 na 401 zgodnie z dokumentacją API
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
            message: "Too many login attempts. Please try again later",
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

    // Log error for debugging (but don't expose to client)
    // TODO: Replace with proper logging service
    // console.error("Login endpoint error:", err);

    // Generic server error
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: "Authentication service temporarily unavailable",
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
