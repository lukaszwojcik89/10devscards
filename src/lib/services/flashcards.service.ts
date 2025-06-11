import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/db/database.types";
import type { GenerateFlashcardsRequest, GenerateFlashcardsResponse, FlashcardListItem } from "@/types";
import { generateFlashcardsRequestSchema } from "./flashcards.zod";

/**
 * Service for handling AI flashcard generation logic
 * Includes deck validation, budget checking, AI calls, and database operations
 */
export class FlashcardsService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Generate flashcards using AI for a specific deck
   * @param request - Validated request data
   * @param userId - ID of the authenticated user
   * @returns Generated flashcards with metadata
   */
  async generateFlashcards(request: GenerateFlashcardsRequest, userId: string): Promise<GenerateFlashcardsResponse> {
    // Walidacja danych wejściowych
    const validated = generateFlashcardsRequestSchema.parse(request);

    // Weryfikacja talii
    await this.verifyDeck(validated.deck_id, userId);

    // Sprawdzenie budżetu
    await this.checkBudgetLimits(userId);

    // Wywołanie AI z difficulty parameter
    const aiRes = await this.callAI(validated.input_text, validated.max_cards, validated.difficulty);

    // Zapis fiszek
    const saved = await this.saveToDB(aiRes.flashcards, validated.deck_id, aiRes.metadata);

    // Zapis zdarzenia budżetu
    await this.recordEvent(userId, aiRes.metadata);

    // Zwrócenie odpowiedzi
    return {
      generated_flashcards: saved,
      generation_summary: {
        total_generated: saved.length,
        total_tokens: aiRes.metadata.tokens_used,
        total_cost_usd: aiRes.metadata.cost_usd,
        model_used: aiRes.metadata.model,
      },
    };
  }

  /**
   * Verify that deck exists and belongs to the user
   */
  private async verifyDeck(deckId: string, userId: string): Promise<Tables<"decks">> {
    const { data: deck, error } = await this.supabase
      .from("decks")
      .select("*")
      .eq("id", deckId)
      .eq("owner_id", userId)
      .eq("is_deleted", false)
      .single();

    if (error || !deck) {
      throw new Error("Deck not found or not owned by user");
    }

    return deck;
  }

  /**
   * Check if user has sufficient budget for AI generation
   */
  private async checkBudgetLimits(userId: string): Promise<void> {
    // Get current month budget usage
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

    const { data: budgetEvents, error } = await this.supabase
      .from("budget_events")
      .select("cumulative_usd")
      .eq("user_id", userId)
      .gte("event_time", `${currentMonth}-01`)
      .order("event_time", { ascending: false })
      .limit(1);

    if (error) {
      throw new Error("Failed to check budget limits");
    }

    const currentSpend = budgetEvents?.[0]?.cumulative_usd || 0;
    const MONTHLY_BUDGET_USD = 10; // $10 monthly limit

    if (currentSpend >= MONTHLY_BUDGET_USD) {
      throw new Error("Monthly budget limit reached");
    }
  }

  /**
   * Call AI service to generate flashcards using OpenRouter API
   */
  private async callAI(
    inputText: string,
    maxFlashcards: number,
    difficulty: "beginner" | "intermediate" | "advanced" = "intermediate"
  ): Promise<{
    flashcards: { question: string; answer: string }[];
    metadata: { tokens_used: number; cost_usd: number; model: string };
  }> {
    const API_KEY = import.meta.env.OPENROUTER_API_KEY;
    const MODEL = import.meta.env.OPENROUTER_MODEL || "anthropic/claude-3-haiku";
    const BASE_URL = import.meta.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";

    if (!API_KEY) {
      throw new Error("OpenRouter API key not configured");
    }

    // Create difficulty-specific prompt
    const difficultyPrompts = {
      beginner: "Create simple, basic flashcards suitable for beginners. Use clear, straightforward language.",
      intermediate:
        "Create moderately challenging flashcards with some depth. Include important concepts and relationships.",
      advanced:
        "Create challenging flashcards that test deep understanding. Include complex concepts, edge cases, and nuanced details.",
    };

    const systemPrompt = `You are an expert educational content creator. Your task is to generate high-quality flashcards based on the provided text.

${difficultyPrompts[difficulty]}

IMPORTANT: Respond with ONLY a valid JSON array in this exact format:
[
  {
    "question": "Clear, specific question",
    "answer": "Comprehensive but concise answer"
  }
]

Generate exactly ${maxFlashcards} flashcards. Each question should be self-contained and each answer should be complete but concise.`;

    try {
      const response = await fetch(`${BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://10devscards.com",
          "X-Title": "AI Flashcards",
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: `Generate flashcards from this content:\n\n${inputText}`,
            },
          ],
          max_tokens: 2000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      if (!data.choices?.[0]?.message?.content) {
        throw new Error("Invalid response from OpenRouter API");
      }

      // Parse the AI response
      let flashcards: { question: string; answer: string }[];
      try {
        const content = data.choices[0].message.content.trim();
        // Remove any markdown code blocks if present
        const jsonContent = content.replace(/```json\s*|\s*```/g, "");
        flashcards = JSON.parse(jsonContent);
      } catch (parseError) {
        throw new Error(`Failed to parse AI response: ${parseError}`);
      }

      // Validate flashcards format
      if (!Array.isArray(flashcards) || flashcards.length === 0) {
        throw new Error("AI did not return valid flashcards array");
      }

      // Ensure all flashcards have required fields
      const validFlashcards = flashcards
        .filter(
          (card) => card.question && card.answer && typeof card.question === "string" && typeof card.answer === "string"
        )
        .slice(0, maxFlashcards); // Limit to requested amount

      if (validFlashcards.length === 0) {
        throw new Error("No valid flashcards generated by AI");
      }

      // Calculate usage metadata
      const tokensUsed = data.usage?.total_tokens || 0;
      const promptTokens = data.usage?.prompt_tokens || 0;
      const completionTokens = data.usage?.completion_tokens || 0;

      // Estimate cost (GPT-4o-mini pricing: ~$0.15/1M input tokens, ~$0.6/1M output tokens)
      const costUsd = promptTokens * 0.00000015 + completionTokens * 0.0000006;

      return {
        flashcards: validFlashcards,
        metadata: {
          tokens_used: tokensUsed,
          cost_usd: costUsd,
          model: MODEL,
        },
      };
    } catch (error) {
      // In production, this should be logged to a proper logging service
      throw new Error(`AI service failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Save generated flashcards to database
   */
  private async saveToDB(
    flashcards: { question: string; answer: string }[],
    deckId: string,
    metadata: { tokens_used: number; cost_usd: number; model: string }
  ): Promise<FlashcardListItem[]> {
    if (flashcards.length === 0) {
      throw new Error("No flashcards generated to save");
    }
    const count = flashcards.length;
    const flashcardsToInsert = flashcards.map((flashcard) => ({
      deck_id: deckId,
      question: flashcard.question,
      answer: flashcard.answer,
      status: "pending" as const,
      box: "box1" as const,
      model: metadata.model,
      tokens_used: metadata.tokens_used,
      price_usd: parseFloat((metadata.cost_usd / count).toFixed(8)), // Distribute cost and round
    }));

    const { data: savedFlashcards, error } = await this.supabase
      .from("flashcards")
      .insert(flashcardsToInsert)
      .select("id, question, answer, status, box, next_due_date, model, tokens_used, price_usd, created_at");

    if (error || !savedFlashcards) {
      throw new Error("Failed to save flashcards to database");
    }

    return savedFlashcards;
  }

  /**
   * Record budget event for tracking costs
   */
  private async recordEvent(
    userId: string,
    metadata: { tokens_used: number; cost_usd: number; model: string }
  ): Promise<void> {
    // Get current cumulative cost
    const { data: lastEvent } = await this.supabase
      .from("budget_events")
      .select("cumulative_usd")
      .eq("user_id", userId)
      .order("event_time", { ascending: false })
      .limit(1);

    const previousCumulative = lastEvent?.[0]?.cumulative_usd || 0;
    const newCumulative = previousCumulative + metadata.cost_usd;

    const { error } = await this.supabase.from("budget_events").insert({
      user_id: userId,
      cost_usd: metadata.cost_usd,
      cumulative_usd: newCumulative,
      tokens_used: metadata.tokens_used,
      model: metadata.model,
      threshold_reached: newCumulative >= 8.0, // 80% of $10 budget
    });

    if (error) {
      throw new Error("Failed to record budget event");
    }
  }
}
