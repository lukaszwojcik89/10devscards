import type { APIRoute } from "astro";
import { supabaseClient } from "@/db/supabase.client";
import { FlashcardsService } from "@/lib/services/flashcards.service";
import type { UpdateFlashcardRequestDTO, ErrorResponseDTO } from "@/types";
import { ZodError } from "zod";

/**
 * GET /api/flashcards/{id} - Get single flashcard by ID
 */
export const GET: APIRoute = async ({ params, request }) => {
  const flashcardId = params.id;
  if (!flashcardId) {
    return new Response(
      JSON.stringify({
        error: {
          code: "BAD_REQUEST",
          message: "Flashcard ID is required",
        },
      } as ErrorResponseDTO),
      { status: 400 }
    );
  }

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
    const service = new FlashcardsService(supabaseClient);
    const result = await service.getFlashcardById(flashcardId, userId);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = (err as Error).message;
    if (message.includes("not found") || message.includes("access denied")) {
      return new Response(
        JSON.stringify({
          error: {
            code: "NOT_FOUND",
            message: "Flashcard not found or access denied",
          },
        } as ErrorResponseDTO),
        { status: 404 }
      );
    }

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
 * PUT /api/flashcards/{id} - Update flashcard content
 */
export const PUT: APIRoute = async ({ params, request }) => {
  const flashcardId = params.id;
  if (!flashcardId) {
    return new Response(
      JSON.stringify({
        error: {
          code: "BAD_REQUEST",
          message: "Flashcard ID is required",
        },
      } as ErrorResponseDTO),
      { status: 400 }
    );
  }

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
    const body = (await request.json()) as UpdateFlashcardRequestDTO;
    const service = new FlashcardsService(supabaseClient);
    const result = await service.updateFlashcard(flashcardId, body, userId);

    return new Response(JSON.stringify(result), {
      status: 200,
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
    if (message.includes("not found") || message.includes("access denied")) {
      return new Response(
        JSON.stringify({
          error: {
            code: "NOT_FOUND",
            message: "Flashcard not found or access denied",
          },
        } as ErrorResponseDTO),
        { status: 404 }
      );
    }

    if (message.includes("Question") || message.includes("Answer") || message.includes("limit")) {
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
 * DELETE /api/flashcards/{id} - Delete flashcard permanently
 */
export const DELETE: APIRoute = async ({ params, request }) => {
  const flashcardId = params.id;
  if (!flashcardId) {
    return new Response(
      JSON.stringify({
        error: {
          code: "BAD_REQUEST",
          message: "Flashcard ID is required",
        },
      } as ErrorResponseDTO),
      { status: 400 }
    );
  }

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
    const service = new FlashcardsService(supabaseClient);
    const result = await service.deleteFlashcard(flashcardId, userId);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = (err as Error).message;
    if (message.includes("not found") || message.includes("access denied")) {
      return new Response(
        JSON.stringify({
          error: {
            code: "NOT_FOUND",
            message: "Flashcard not found or access denied",
          },
        } as ErrorResponseDTO),
        { status: 404 }
      );
    }

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
