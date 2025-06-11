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

    // Wywołanie AI (placeholder)
    const aiRes = await this.callAI(validated.input_text, validated.max_flashcards);

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
   * Call AI service to generate flashcards (placeholder implementation)
   */
  private async callAI(
    _inputText: string,
    _maxFlashcards: number
  ): Promise<{
    flashcards: { question: string; answer: string }[];
    metadata: { tokens_used: number; cost_usd: number; model: string };
  }> {
    // TODO: Implement actual AI service call (OpenRouter/GPT-4o-mini)
    // Placeholder implementation: ignore inputText and _maxFlashcards

    return {
      flashcards: Array(_maxFlashcards).fill({ question: "Sample question from AI", answer: "Sample answer from AI" }),
      metadata: { tokens_used: 85 * _maxFlashcards, cost_usd: 0.000025 * _maxFlashcards, model: "gpt-4o-mini" },
    };
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
