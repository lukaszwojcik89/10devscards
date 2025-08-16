/* eslint-disable no-console */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables, TablesUpdate } from "@/db/database.types";
import { supabaseAdminClient } from "@/db/supabase.client";
import type {
  GenerateFlashcardsRequest,
  GenerateFlashcardsResponse,
  FlashcardListItem,
  FlashcardListResponseDTO,
  FlashcardDetailResponseDTO,
  CreateFlashcardRequestDTO,
  FlashcardResponseData,
  UpdateFlashcardRequestDTO,
  DeleteFlashcardResponseDTO,
} from "@/types";
import { generateFlashcardsRequestSchema } from "./flashcards.zod";

/**
 * Service for handling flashcard operations including AI generation and CRUD
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

    console.log("FlashcardsService.generateFlashcards - start:", {
      deck_id: validated.deck_id,
      userId,
      input_text: validated.input_text.substring(0, 100) + "...",
      max_cards: validated.max_cards,
      timestamp: new Date().toISOString(),
    });

    // Obsługa deck_id - CREATE_NEW lub istniejąca talia
    let deckId: string;
    if (validated.deck_id === "CREATE_NEW") {
      console.log("Creating new deck from topic...");
      // Tworzymy nową talię na podstawie tematu lub danych użytkownika
      const newDeck = await this.createDeckFromTopic(
        validated.input_text,
        userId,
        validated.new_deck_name,
        validated.new_deck_description
      );
      deckId = newDeck.id;
      console.log("New deck created:", { deckId, name: newDeck.name });
    } else {
      console.log("Verifying existing deck:", { deck_id: validated.deck_id });
      // Weryfikacja istniejącej talii
      await this.verifyDeck(validated.deck_id, userId);
      deckId = validated.deck_id;
      console.log("Deck verified successfully:", { deckId });
    }

    // Sprawdzenie budżetu
    await this.checkBudgetLimits(userId);

    // Wywołanie AI z difficulty parameter
    const aiRes = await this.callAI(
      validated.input_text,
      validated.max_cards,
      validated.difficulty,
      validated.context,
      validated.language
    );

    // Zapis fiszek
    const saved = await this.saveToDB(aiRes.flashcards, deckId, aiRes.metadata);

    // Zapis zdarzenia budżetu
    await this.recordEvent(userId, aiRes.metadata);

    // Pobierz slug nowo utworzonej/istniejącej talii
    const { data: deck } = await this.supabase.from("decks").select("slug").eq("id", deckId).single();

    // Zwrócenie odpowiedzi
    return {
      data: {
        generated_flashcards: saved,
        deck_slug: deck?.slug || "",
        generation_summary: {
          total_generated: saved.length,
          total_tokens: aiRes.metadata.tokens_used,
          total_cost_usd: aiRes.metadata.cost_usd,
          model_used: aiRes.metadata.model,
        },
      },
    };
  }

  /**
   * Create a new deck from topic for AI generation
   */
  private async createDeckFromTopic(
    topic: string,
    userId: string,
    customName?: string,
    customDescription?: string
  ): Promise<Tables<"decks">> {
    // Import DeckService (lazy import to avoid circular dependency)
    const { DeckService } = await import("./deck.service");
    const deckService = new DeckService(this.supabase);

    // Use custom name if provided, otherwise generate from topic
    const deckName = customName?.trim() || (topic.length > 100 ? topic.substring(0, 97) + "..." : topic);

    // Use custom description if provided, otherwise generate from topic
    const deckDescription = customDescription?.trim() || `Fiszki AI: ${topic}`;

    const newDeck = await deckService.createDeck({
      name: deckName,
      description: deckDescription,
      owner_id: userId,
    });

    return newDeck;
  }

  /**
   * Verify that deck exists and belongs to the user
   */
  private async verifyDeck(deckId: string, userId: string): Promise<Tables<"decks">> {
    console.log("Verifying deck:", { deckId, userId });

    const { data: deck, error } = await this.supabase
      .from("decks")
      .select("*")
      .eq("id", deckId)
      .eq("owner_id", userId)
      .or("is_deleted.eq.false,is_deleted.is.null")
      .single();

    if (error || !deck) {
      console.error("Deck verification failed:", { error, deck, deckId, userId });
      throw new Error(`Deck not found or not owned by user. Deck ID: ${deckId}, User ID: ${userId}`);
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
    difficulty: "beginner" | "intermediate" | "advanced" = "intermediate",
    context: string | undefined,
    language: "pl" | "en" | "de" | "fr" | "es" | "it"
  ): Promise<{
    flashcards: { question: string; answer: string }[];
    metadata: { tokens_used: number; cost_usd: number; model: string };
  }> {
    const API_KEY = import.meta.env.OPENROUTER_API_KEY;
    const MODEL = import.meta.env.OPENROUTER_MODEL || "anthropic/claude-3-haiku";
    const BASE_URL = import.meta.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";

    if (!API_KEY) {
      throw new Error(
        "OpenRouter API key not configured. Please set OPENROUTER_API_KEY in your environment variables."
      );
    }

    console.log("OpenRouter config:", {
      hasApiKey: !!API_KEY,
      model: MODEL,
      baseUrl: BASE_URL,
      apiKeyPrefix: API_KEY ? API_KEY.substring(0, 10) + "..." : "none",
    });

    // Language mapping for clear instructions
    const languageInstructions = {
      pl: "WAŻNE: Generuj wszystkie fiszki w języku polskim. Zarówno pytania jak i odpowiedzi muszą być po polsku.",
      en: "IMPORTANT: Generate all flashcards in English. Both questions and answers must be in English.",
      de: "WICHTIG: Generiere alle Karteikarten auf Deutsch. Sowohl Fragen als auch Antworten müssen auf Deutsch sein.",
      fr: "IMPORTANT: Générez toutes les cartes en français. Les questions et réponses doivent être en français.",
      es: "IMPORTANTE: Genera todas las tarjetas en español. Tanto preguntas como respuestas deben estar en español.",
      it: "IMPORTANTE: Genera tutte le schede in italiano. Sia domande che risposte devono essere in italiano.",
    };
    // Create difficulty-specific prompt
    const difficultyPrompts = {
      beginner: "Create simple, basic flashcards suitable for beginners. Use clear, straightforward language.",
      intermediate:
        "Create moderately challenging flashcards with some depth. Include important concepts and relationships.",
      advanced:
        "Create challenging flashcards that test deep understanding. Include complex concepts, edge cases, and nuanced details.",
    };

    const systemPrompt = `You are an expert educational content creator. Your task is to generate high-quality flashcards based on the provided text.

${languageInstructions[language as keyof typeof languageInstructions] || languageInstructions.pl}
${difficultyPrompts[difficulty]}

${context ? `\nKONTEKST DODATKOWY: ${context}\nTo jest bardzo ważne - fiszki MUSZĄ być związane z tym kontekstem. Ignoruj inne tematy i skup się tylko na tym kontekście.` : ""}

IMPORTANT: Respond with ONLY a valid JSON array in this exact format:
[
  {
    "question": "Clear, specific question",
    "answer": "Comprehensive but concise answer"
  }
]

Generate exactly ${maxFlashcards} flashcards. Each question should be self-contained and each answer should be complete but concise.`;

    try {
      console.log("Making request to OpenRouter...");

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

      console.log("OpenRouter response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenRouter API error:", response.status, errorText);
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("OpenRouter response data:", data);

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

      // If we got significantly fewer flashcards than requested, try again with adjusted prompt
      if (validFlashcards.length < maxFlashcards * 0.8) {
        console.log(
          `Generated only ${validFlashcards.length}/${maxFlashcards} flashcards. Retrying with more aggressive prompt...`
        );

        const retrySystemPrompt = `You are an expert educational content creator. Your task is to generate high-quality flashcards based on the provided text.

${languageInstructions[language as keyof typeof languageInstructions] || languageInstructions.pl}
${difficultyPrompts[difficulty]}

${context ? `\nKONTEKST DODATKOWY: ${context}\nTo jest bardzo ważne - fiszki MUSZĄ być związane z tym kontekstem. Ignoruj inne tematy i skup się tylko na tym kontekście.` : ""}

CRITICAL: You MUST generate exactly ${maxFlashcards} flashcards. This is a hard requirement. 
Do not generate fewer than ${maxFlashcards} flashcards under any circumstances.
If the content seems insufficient, create more detailed questions about different aspects, implications, examples, or related concepts.

IMPORTANT: Respond with ONLY a valid JSON array in this exact format:
[
  {
    "question": "Clear, specific question",
    "answer": "Comprehensive but concise answer"
  }
]

Generate exactly ${maxFlashcards} flashcards. Each question should be self-contained and each answer should be complete but concise.`;

        const retryResponse = await fetch(`${BASE_URL}/chat/completions`, {
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
                content: retrySystemPrompt,
              },
              {
                role: "user",
                content: `Generate exactly ${maxFlashcards} flashcards from this content. You must create exactly ${maxFlashcards} flashcards, no more, no less:\n\n${inputText}`,
              },
            ],
            max_tokens: 3000, // Increased for more flashcards
            temperature: 0.5, // Lower temperature for more consistent results
          }),
        });

        if (retryResponse.ok) {
          const retryData = await retryResponse.json();
          const retryContent = retryData.choices?.[0]?.message?.content?.trim();

          if (retryContent) {
            try {
              const retryFlashcards = JSON.parse(retryContent);
              if (Array.isArray(retryFlashcards)) {
                const retryValidFlashcards = retryFlashcards
                  .filter(
                    (card) =>
                      card.question &&
                      card.answer &&
                      typeof card.question === "string" &&
                      typeof card.answer === "string"
                  )
                  .slice(0, maxFlashcards);

                if (retryValidFlashcards.length > validFlashcards.length) {
                  console.log(`Retry successful: ${retryValidFlashcards.length}/${maxFlashcards} flashcards generated`);
                  // Use retry result instead
                  const retryTokensUsed = retryData.usage?.total_tokens || 0;
                  const retryPromptTokens = retryData.usage?.prompt_tokens || 0;
                  const retryCompletionTokens = retryData.usage?.completion_tokens || 0;
                  const retryCostUsd = retryPromptTokens * 0.00000015 + retryCompletionTokens * 0.0000006;

                  return {
                    flashcards: retryValidFlashcards,
                    metadata: {
                      tokens_used: retryTokensUsed,
                      cost_usd: retryCostUsd,
                      model: MODEL,
                    },
                  };
                }
              }
            } catch {
              console.log("Retry parsing failed, using original result");
            }
          }
        }
      }

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
      console.error("AI service error details:", error);
      console.error("Full error object:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined,
      });

      // Handle specific network errors
      if (error instanceof TypeError && error.message === "fetch failed") {
        throw new Error("Network connection failed. Please check your internet connection and try again.");
      }

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
    const { data: lastEvent, error: fetchError } = await supabaseAdminClient
      .from("budget_events")
      .select("cumulative_usd")
      .eq("user_id", userId)
      .order("event_time", { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error("Failed to fetch last budget event:", fetchError);
      throw new Error(`Failed to fetch budget history: ${fetchError.message}`);
    }

    const previousCumulative = lastEvent?.[0]?.cumulative_usd || 0;
    const newCumulative = previousCumulative + metadata.cost_usd;

    console.log("Budget calculation:", { previousCumulative, newCumulative, costUsd: metadata.cost_usd });

    const { error } = await supabaseAdminClient.from("budget_events").insert({
      user_id: userId,
      cost_usd: metadata.cost_usd,
      cumulative_usd: newCumulative,
      tokens_used: metadata.tokens_used,
      model: metadata.model,
      threshold_reached: newCumulative >= 8.0, // 80% of $10 budget
    });

    if (error) {
      console.error("Failed to insert budget event:", error);
      throw new Error("Failed to record budget event");
    }

    console.log("Budget event recorded successfully");
  }

  /**
   * Get flashcards for user with filtering options
   */
  async getFlashcards(
    userId: string,
    filters: {
      deckId?: string;
      status?: "pending" | "accepted" | "rejected";
      box?: "box1" | "box2" | "box3" | "graduated";
      limit: number;
      offset: number;
    }
  ): Promise<FlashcardListResponseDTO> {
    let query = this.supabase
      .from("flashcards")
      .select(
        `*,
        decks!inner(owner_id)`
      )
      .eq("decks.owner_id", userId);

    // Apply filters
    if (filters.deckId) {
      query = query.eq("deck_id", filters.deckId);
    }
    if (filters.status) {
      query = query.eq("status", filters.status);
    }
    if (filters.box) {
      query = query.eq("box", filters.box);
    }

    // Get total count for pagination
    const countQuery = this.supabase.from("flashcards").select("*", { count: "exact", head: true });
    if (filters.deckId) {
      countQuery.eq("deck_id", filters.deckId);
    }
    if (filters.status) {
      countQuery.eq("status", filters.status);
    }
    if (filters.box) {
      countQuery.eq("box", filters.box);
    }
    const { count } = await countQuery;
    const total = count || 0;

    // Get paginated results
    const { data: flashcards, error } = await query
      .order("created_at", { ascending: false })
      .range(filters.offset, filters.offset + filters.limit - 1);

    if (error) {
      throw new Error(`Failed to fetch flashcards: ${error.message}`);
    }

    // Remove the join data and format response
    const cleanedFlashcards: FlashcardResponseData[] =
      flashcards?.map((item) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { decks, ...flashcard } = item;
        return flashcard;
      }) || [];

    return {
      data: cleanedFlashcards,
      pagination: {
        total,
        limit: filters.limit,
        offset: filters.offset,
        has_more: filters.offset + filters.limit < total,
      },
    };
  }

  /**
   * Get single flashcard by ID
   */
  async getFlashcardById(flashcardId: string, userId: string): Promise<FlashcardDetailResponseDTO> {
    const { data: flashcard, error } = await this.supabase
      .from("flashcards")
      .select(
        `*,
        decks!inner(owner_id)`
      )
      .eq("id", flashcardId)
      .eq("decks.owner_id", userId)
      .single();

    if (error || !flashcard) {
      throw new Error("Flashcard not found or access denied");
    }

    // Remove the join data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { decks, ...cleanFlashcard } = flashcard;

    return {
      data: cleanFlashcard as FlashcardResponseData,
    };
  }

  /**
   * Create new flashcard manually
   */
  async createFlashcard(request: CreateFlashcardRequestDTO, userId: string): Promise<FlashcardDetailResponseDTO> {
    // Verify deck ownership
    await this.verifyDeck(request.deck_id, userId);

    // Check deck flashcard limit (max 1000 per deck)
    const { count } = await this.supabase
      .from("flashcards")
      .select("*", { count: "exact", head: true })
      .eq("deck_id", request.deck_id);

    if ((count || 0) >= 1000) {
      throw new Error("Maximum flashcard limit reached for this deck (1000)");
    }

    // Create flashcard with default values
    const { data: flashcard, error } = await this.supabase
      .from("flashcards")
      .insert({
        deck_id: request.deck_id,
        question: request.question,
        answer: request.answer,
        status: "accepted", // Manual flashcards are auto-accepted
        box: "box1",
        next_due_date: new Date().toISOString(), // Available immediately
        model: null,
        tokens_used: null,
        price_usd: null,
      })
      .select()
      .single();

    if (error || !flashcard) {
      throw new Error(`Failed to create flashcard: ${error?.message}`);
    }

    return {
      data: flashcard as FlashcardResponseData,
    };
  }

  /**
   * Update flashcard content (question and/or answer)
   */
  async updateFlashcard(
    flashcardId: string,
    request: UpdateFlashcardRequestDTO,
    userId: string
  ): Promise<FlashcardDetailResponseDTO> {
    // Verify flashcard ownership through deck ownership
    const { data: existingFlashcard } = await this.supabase
      .from("flashcards")
      .select(
        `id,
        decks!inner(owner_id)`
      )
      .eq("id", flashcardId)
      .eq("decks.owner_id", userId)
      .single();

    if (!existingFlashcard) {
      throw new Error("Flashcard not found or access denied");
    }

    // Validate input lengths
    if (request.question && request.question.length > 256) {
      throw new Error("Question text exceeds maximum length of 256 characters");
    }
    if (request.answer && request.answer.length > 512) {
      throw new Error("Answer text exceeds maximum length of 512 characters");
    }

    // Update flashcard
    const updateData: Partial<TablesUpdate<"flashcards">> = {
      updated_at: new Date().toISOString(),
    };

    if (request.question !== undefined) {
      updateData.question = request.question;
    }
    if (request.answer !== undefined) {
      updateData.answer = request.answer;
    }

    const { data: updatedFlashcard, error } = await this.supabase
      .from("flashcards")
      .update(updateData)
      .eq("id", flashcardId)
      .select()
      .single();

    if (error || !updatedFlashcard) {
      throw new Error(`Failed to update flashcard: ${error?.message}`);
    }

    return {
      data: updatedFlashcard as FlashcardResponseData,
    };
  }

  /**
   * Delete flashcard permanently
   */
  async deleteFlashcard(flashcardId: string, userId: string): Promise<DeleteFlashcardResponseDTO> {
    // Verify flashcard ownership through deck ownership
    const { data: existingFlashcard } = await this.supabase
      .from("flashcards")
      .select(
        `id,
        decks!inner(owner_id)`
      )
      .eq("id", flashcardId)
      .eq("decks.owner_id", userId)
      .single();

    if (!existingFlashcard) {
      throw new Error("Flashcard not found or access denied");
    }

    // Delete flashcard (reviews will be cascade deleted by foreign key constraint)
    const { error } = await this.supabase.from("flashcards").delete().eq("id", flashcardId);

    if (error) {
      throw new Error(`Failed to delete flashcard: ${error.message}`);
    }

    return {
      message: "Flashcard deleted successfully",
    };
  }
}
