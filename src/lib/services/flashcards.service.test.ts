import { describe, it, expect, beforeEach, vi } from "vitest";
import { FlashcardsService } from "./flashcards.service";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import type { GenerateFlashcardsRequest } from "@/types";

// Mock supabase client with minimal methods
const mockFrom = vi.fn();
const mockSupabase = {
  from: mockFrom,
} as unknown as SupabaseClient<Database>;

describe("FlashcardsService.generateFlashcards", () => {
  let service: FlashcardsService;

  beforeEach(() => {
    service = new FlashcardsService(mockSupabase);
    mockFrom.mockReset();
    vi.clearAllMocks();
  });

  it("should throw when no flashcards generated", async () => {
    // Arrange: mock all required methods
    // @ts-expect-error - accessing private method for testing
    vi.spyOn(service, "verifyDeck").mockResolvedValue(undefined);
    // @ts-expect-error - accessing private method for testing
    vi.spyOn(service, "checkBudgetLimits").mockResolvedValue(undefined);
    // @ts-expect-error - accessing private method for testing
    vi.spyOn(service, "callAI").mockResolvedValue({
      flashcards: [],
      metadata: { tokens_used: 0, cost_usd: 0, model: "test" },
    });

    const request: GenerateFlashcardsRequest = {
      deck_id: "00000000-0000-0000-0000-000000000000",
      input_text: "test",
      max_cards: 5,
      difficulty: "intermediate",
    };

    // Act & Assert
    await expect(service.generateFlashcards(request, "user-id")).rejects.toThrow("No flashcards generated to save");
  });

  it("should generate and save flashcards successfully", async () => {
    // Arrange: mock all required methods
    // @ts-expect-error - accessing private method for testing
    vi.spyOn(service, "verifyDeck").mockResolvedValue(undefined);
    // @ts-expect-error - accessing private method for testing
    vi.spyOn(service, "checkBudgetLimits").mockResolvedValue(undefined);

    // Mock callAI
    const fakeFlashcards = [
      { question: "What is TypeScript?", answer: "A typed superset of JavaScript" },
      { question: "What are interfaces?", answer: "Contracts that define object shapes" },
    ];
    const fakeMeta = { tokens_used: 150, cost_usd: 0.003, model: "openai/gpt-4o-mini" };
    // @ts-expect-error - accessing private method for testing
    vi.spyOn(service, "callAI").mockResolvedValue({
      flashcards: fakeFlashcards,
      metadata: fakeMeta,
    });

    // Mock saveToDB
    // @ts-expect-error - accessing private method for testing
    vi.spyOn(service, "saveToDB").mockResolvedValue([
      {
        id: "1",
        question: "What is TypeScript?",
        answer: "A typed superset of JavaScript",
        status: "pending",
        box: "box1",
        next_due_date: "2025-01-01T00:00:00Z",
        model: "openai/gpt-4o-mini",
        tokens_used: 75,
        price_usd: 0.0015,
        created_at: "2025-01-01T00:00:00Z",
      },
      {
        id: "2",
        question: "What are interfaces?",
        answer: "Contracts that define object shapes",
        status: "pending",
        box: "box1",
        next_due_date: "2025-01-01T00:00:00Z",
        model: "openai/gpt-4o-mini",
        tokens_used: 75,
        price_usd: 0.0015,
        created_at: "2025-01-01T00:00:00Z",
      },
    ]);

    // Mock recordEvent
    // @ts-expect-error - accessing private method for testing
    vi.spyOn(service, "recordEvent").mockResolvedValue(undefined);

    const request: GenerateFlashcardsRequest = {
      deck_id: "00000000-0000-0000-0000-000000000000",
      input_text: "TypeScript basics: types, interfaces, and classes",
      max_cards: 5,
      difficulty: "intermediate",
    };

    // Act
    const result = await service.generateFlashcards(request, "user-id");

    // Assert
    expect(result.generated_flashcards).toHaveLength(2);
    expect(result.generation_summary).toEqual({
      total_generated: 2,
      total_tokens: 150,
      total_cost_usd: 0.003,
      model_used: "openai/gpt-4o-mini",
    });

    // Verify all methods were called with correct parameters
    expect(vi.mocked(service["verifyDeck"])).toHaveBeenCalledWith("00000000-0000-0000-0000-000000000000", "user-id");
    expect(vi.mocked(service["checkBudgetLimits"])).toHaveBeenCalledWith("user-id");
    expect(vi.mocked(service["callAI"])).toHaveBeenCalledWith(
      "TypeScript basics: types, interfaces, and classes",
      5,
      "intermediate"
    );
    expect(vi.mocked(service["saveToDB"])).toHaveBeenCalledWith(
      fakeFlashcards,
      "00000000-0000-0000-0000-000000000000",
      fakeMeta
    );
    expect(vi.mocked(service["recordEvent"])).toHaveBeenCalledWith("user-id", fakeMeta);
  });

  it("should handle different difficulty levels", async () => {
    // Arrange: mock all required methods
    // @ts-expect-error - accessing private method for testing
    vi.spyOn(service, "verifyDeck").mockResolvedValue(undefined);
    // @ts-expect-error - accessing private method for testing
    vi.spyOn(service, "checkBudgetLimits").mockResolvedValue(undefined);

    const fakeFlashcards = [{ question: "Basic question", answer: "Basic answer" }];
    const fakeMeta = { tokens_used: 50, cost_usd: 0.001, model: "openai/gpt-4o-mini" };
    // @ts-expect-error - accessing private method for testing
    vi.spyOn(service, "callAI").mockResolvedValue({
      flashcards: fakeFlashcards,
      metadata: fakeMeta,
    });

    // @ts-expect-error - accessing private method for testing
    vi.spyOn(service, "saveToDB").mockResolvedValue([
      {
        id: "1",
        question: "Basic question",
        answer: "Basic answer",
        status: "pending",
        box: "box1",
        next_due_date: "2025-01-01T00:00:00Z",
        model: "openai/gpt-4o-mini",
        tokens_used: 50,
        price_usd: 0.001,
        created_at: "2025-01-01T00:00:00Z",
      },
    ]);

    // @ts-expect-error - accessing private method for testing
    vi.spyOn(service, "recordEvent").mockResolvedValue(undefined);

    const request: GenerateFlashcardsRequest = {
      deck_id: "00000000-0000-0000-0000-000000000000",
      input_text: "Simple math concepts",
      max_cards: 3,
      difficulty: "beginner",
    };

    // Act
    await service.generateFlashcards(request, "user-id");

    // Assert
    expect(vi.mocked(service["callAI"])).toHaveBeenCalledWith("Simple math concepts", 3, "beginner");
  });

  it("should use default values when not provided", async () => {
    // Arrange: mock all required methods
    // @ts-expect-error - accessing private method for testing
    vi.spyOn(service, "verifyDeck").mockResolvedValue(undefined);
    // @ts-expect-error - accessing private method for testing
    vi.spyOn(service, "checkBudgetLimits").mockResolvedValue(undefined);

    const fakeFlashcards = [{ question: "Default question", answer: "Default answer" }];
    const fakeMeta = { tokens_used: 75, cost_usd: 0.0015, model: "openai/gpt-4o-mini" };
    // @ts-expect-error - accessing private method for testing
    vi.spyOn(service, "callAI").mockResolvedValue({
      flashcards: fakeFlashcards,
      metadata: fakeMeta,
    });

    // @ts-expect-error - accessing private method for testing
    vi.spyOn(service, "saveToDB").mockResolvedValue([
      {
        id: "1",
        question: "Default question",
        answer: "Default answer",
        status: "pending",
        box: "box1",
        next_due_date: "2025-01-01T00:00:00Z",
        model: "openai/gpt-4o-mini",
        tokens_used: 75,
        price_usd: 0.0015,
        created_at: "2025-01-01T00:00:00Z",
      },
    ]);

    // @ts-expect-error - accessing private method for testing
    vi.spyOn(service, "recordEvent").mockResolvedValue(undefined);

    const request: GenerateFlashcardsRequest = {
      deck_id: "00000000-0000-0000-0000-000000000000",
      input_text: "Test content",
      // max_cards and difficulty should default
    };

    // Act
    await service.generateFlashcards(request, "user-id");

    // Assert - should use default values: max_cards=5, difficulty="intermediate"
    expect(vi.mocked(service["callAI"])).toHaveBeenCalledWith("Test content", 5, "intermediate");
  });
});
