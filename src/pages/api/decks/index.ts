import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";
import { supabaseClient } from "@/db/supabase.client";
import { AuthService } from "@/lib/services/auth.service";
import { DeckService } from "@/lib/services/deck.service";
import type { DeckListResponseDTO, ErrorResponseDTO, CreateDeckResponseDTO } from "@/types";
import { deckListQuerySchema, createDeckRequestSchema } from "@/lib/services/deck.zod";
import { ZodError } from "zod";

export const GET: APIRoute = async ({ request, url }) => {
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

    // Validate user session and get user profile
    const authService = new AuthService(supabaseClient);
    const userProfile = await authService.getCurrentUser(token);

    // Create authenticated supabase client
    const authenticatedClient = createClient(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Parse query parameters
    const searchParams = Object.fromEntries(url.searchParams.entries());
    const validated = deckListQuerySchema.parse(searchParams);

    // Initialize deck service and fetch decks
    const deckService = new DeckService(authenticatedClient);
    const result = await deckService.listUserDecks(userProfile.id, validated);

    const response: DeckListResponseDTO = result;

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
            message: "Invalid query parameters",
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

    // Handle authentication errors
    const error = err as Error;

    if (error.message.includes("Invalid or expired token")) {
      return new Response(
        JSON.stringify({
          error: {
            code: "INVALID_TOKEN",
            message: "The provided access token is invalid or has expired",
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
    const errorMessage = error.message || "Unknown error";
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred while fetching decks",
          details: { error: errorMessage },
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

    // Validate user session and get user profile
    const authService = new AuthService(supabaseClient);
    const userProfile = await authService.getCurrentUser(token);

    // Create authenticated supabase client
    const authenticatedClient = createClient(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Parse and validate request body
    const body = await request.json();
    const validated = createDeckRequestSchema.parse(body);

    // Initialize deck service and create deck
    const deckService = new DeckService(authenticatedClient);
    const result = await deckService.createDeck({
      name: validated.name,
      description: validated.description,
      slug: validated.slug,
      owner_id: userProfile.id,
    });

    const response: CreateDeckResponseDTO = { data: result }; // wrap in data

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
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
          error: { code: "VALIDATION_ERROR", message: "Invalid request data", details },
        } as ErrorResponseDTO),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle business logic errors
    const error = err as Error;

    if (error.message.includes("Invalid or expired token")) {
      return new Response(
        JSON.stringify({
          error: {
            code: "INVALID_TOKEN",
            message: "The provided access token is invalid or has expired",
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

    if (error.message.includes("already exists")) {
      return new Response(
        JSON.stringify({
          error: {
            code: "DUPLICATE_SLUG",
            message: "A deck with this slug already exists",
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

    // Handle other errors
    const errorMessage = error.message || "Unknown error";
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred while creating deck",
          details: { error: errorMessage },
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
