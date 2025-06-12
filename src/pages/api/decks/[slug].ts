import type { APIRoute } from "astro";
import { supabaseClient } from "@/db/supabase.client";
import { AuthService } from "@/lib/services/auth.service";
import { DeckService } from "@/lib/services/deck.service";
import type { DeckDetailResponseDTO, ErrorResponseDTO } from "@/types";

export const GET: APIRoute = async ({ params, request }) => {
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
    const { slug } = params;

    if (!slug) {
      return new Response(
        JSON.stringify({
          error: {
            code: "MISSING_SLUG",
            message: "Deck slug is required",
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

    // Validate user session and get user profile
    const authService = new AuthService(supabaseClient);
    const userProfile = await authService.getCurrentUser(token);

    // Initialize deck service and fetch deck
    const deckService = new DeckService(supabaseClient);
    const result = await deckService.getDeckBySlug(slug, userProfile.id);

    const response: DeckDetailResponseDTO = result;

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

    if (error.message.includes("not found")) {
      return new Response(
        JSON.stringify({
          error: {
            code: "DECK_NOT_FOUND",
            message: "Deck not found or you don't have access to it",
          },
        } as ErrorResponseDTO),
        {
          status: 404,
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
          message: "An unexpected error occurred while fetching deck",
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

export const PUT: APIRoute = async ({ params, request }) => {
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
    const { slug } = params;

    if (!slug) {
      return new Response(
        JSON.stringify({
          error: {
            code: "MISSING_SLUG",
            message: "Deck slug is required",
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

    // Validate user session and get user profile
    const authService = new AuthService(supabaseClient);
    const userProfile = await authService.getCurrentUser(token);

    // Parse request body
    const body = await request.json();

    // Initialize deck service and update deck
    const deckService = new DeckService(supabaseClient);
    const result = await deckService.updateDeck({
      ...body,
      slug: slug,
      owner_id: userProfile.id,
    });

    const response: DeckDetailResponseDTO = result;

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

    if (error.message.includes("not found")) {
      return new Response(
        JSON.stringify({
          error: {
            code: "DECK_NOT_FOUND",
            message: "Deck not found or you don't have access to it",
          },
        } as ErrorResponseDTO),
        {
          status: 404,
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
          message: "An unexpected error occurred while updating deck",
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
