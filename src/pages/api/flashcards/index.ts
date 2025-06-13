import type { APIRoute } from "astro";
import { supabaseClient } from "@/db/supabase.client";
import { FlashcardsService } from "@/lib/services/flashcards.service";
import type { CreateFlashcardRequestDTO, ErrorResponseDTO } from "@/types";
import { ZodError } from "zod";

/**
 * GET /api/flashcards - List all flashcards for authenticated user with filtering
 * Query params: deck_id?, status?, box?, limit?, offset?
 */
export const GET: APIRoute = async ({ request, url }) => {
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
    // Parse query parameters
    const searchParams = url.searchParams;
    const deckId = searchParams.get("deck_id") || undefined;
    const status = searchParams.get("status") || undefined;
    const box = searchParams.get("box") || undefined;
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0"), 0);

    const service = new FlashcardsService(supabaseClient);
    const result = await service.getFlashcards(userId, {
      deckId,
      status,
      box,
      limit,
      offset,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    // Log error for debugging but don't expose details
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

/**
 * POST /api/flashcards - Create new flashcard manually
 */
export const POST: APIRoute = async ({ request }) => {
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
    const body = (await request.json()) as CreateFlashcardRequestDTO;
    const service = new FlashcardsService(supabaseClient);
    const result = await service.createFlashcard(body, userId);

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    if (err instanceof ZodError) {
      const details = err.errors.map((e) => e.message).join("; ");
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input data",
            details: { validation: details },
          },
        } as ErrorResponseDTO),
        { status: 400 }
      );
    }

    const message = (err as Error).message;
    if (message.includes("Deck not found") || message.includes("not belong")) {
      return new Response(
        JSON.stringify({
          error: {
            code: "NOT_FOUND",
            message: "Deck not found or access denied",
          },
        } as ErrorResponseDTO),
        { status: 404 }
      );
    }

    if (message.includes("limit") || message.includes("maximum")) {
      return new Response(
        JSON.stringify({
          error: {
            code: "BAD_REQUEST",
            message: message,
          },
        } as ErrorResponseDTO),
        { status: 400 }
      );
    }

    // Log error for debugging but don't expose details
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
