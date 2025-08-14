import type { APIRoute } from "astro";
import { supabaseClient } from "@/db/supabase.client";
import { FlashcardsService } from "@/lib/services/flashcards.service";
import type { GenerateFlashcardsRequest, ErrorResponseDTO } from "@/types";
import { ZodError } from "zod";

export const POST: APIRoute = async ({ request }) => {
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
    const body = (await request.json()) as GenerateFlashcardsRequest;
    console.log("Generate flashcards request:", { 
      ...body, 
      userId,
      timestamp: new Date().toISOString() 
    });
    
    const service = new FlashcardsService(supabaseClient);
    const result = await service.generateFlashcards(body, userId);
    
    console.log("Generate flashcards result:", result);

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
            code: "BAD_REQUEST",
            message: "Bad Request",
            details: { validation: details },
          },
        } as ErrorResponseDTO),
        {
          status: 400,
        }
      );
    }
    const message = (err as Error).message;
    console.error("Generate flashcards error:", {
      message,
      userId,
      error: err,
      stack: err instanceof Error ? err.stack : undefined
    });
    
    if (message.includes("Deck not found")) {
      return new Response(
        JSON.stringify({
          error: {
            code: "NOT_FOUND",
            message: `Deck not found: ${message}`,
          },
        } as ErrorResponseDTO),
        { status: 404 }
      );
    }
    if (message.includes("budget limit")) {
      return new Response(
        JSON.stringify({
          error: {
            code: "PAYMENT_REQUIRED",
            message: "Payment Required",
          },
        } as ErrorResponseDTO),
        { status: 402 }
      );
    }
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: message,
        },
      } as ErrorResponseDTO),
      { status: 500 }
    );
  }
};
