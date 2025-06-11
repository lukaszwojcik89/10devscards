import type { APIRoute } from "astro";
import { supabaseClient } from "@/db/supabase.client";
import { FlashcardsService } from "@/lib/services/flashcards.service";
import type { GenerateFlashcardsRequest, ErrorResponse } from "@/types";
import { ZodError } from "zod";

export const POST: APIRoute = async ({ request }) => {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" } as ErrorResponse), { status: 401 });
  }
  const token = authHeader.slice(7);

  const {
    data: { user },
    error: authError,
  } = await supabaseClient.auth.getUser(token);

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" } as ErrorResponse), { status: 401 });
  }
  const userId = user.id;

  try {
    const body = (await request.json()) as GenerateFlashcardsRequest;
    const service = new FlashcardsService(supabaseClient);
    const result = await service.generateFlashcards(body, userId);

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    if (err instanceof ZodError) {
      const details = err.errors.map((e) => e.message).join("; ");
      return new Response(JSON.stringify({ error: "Bad Request", details } as ErrorResponse), {
        status: 400,
      });
    }
    const message = (err as Error).message;
    if (message.includes("Deck not found")) {
      return new Response(JSON.stringify({ error: "Not Found" } as ErrorResponse), { status: 404 });
    }
    if (message.includes("budget limit")) {
      return new Response(JSON.stringify({ error: "Payment Required" } as ErrorResponse), { status: 402 });
    }
    return new Response(JSON.stringify({ error: "Internal Server Error" } as ErrorResponse), { status: 500 });
  }
};
