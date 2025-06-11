import { describe, it, expect, vi, beforeEach } from "vitest";
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
      max_flashcards: 1,
    };

    // Act & Assert
    await expect(service.generateFlashcards(request, "user-id")).rejects.toThrow();
  });

  it("should generate and save flashcards", async () => {
    // Arrange: mock all required methods
    // @ts-expect-error - accessing private method for testing
    vi.spyOn(service, "verifyDeck").mockResolvedValue(undefined);
    // @ts-expect-error - accessing private method for testing
    vi.spyOn(service, "checkBudgetLimits").mockResolvedValue(undefined);

    // Mock callAI
    const fakeFlashcards = [{ question: "Q1", answer: "A1" }];
    const fakeMeta = { tokens_used: 10, cost_usd: 0.001, model: "gpt" };
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
        question: "Q1",
        answer: "A1",
        status: "pending",
        box: "box1",
        next_due_date: "2025-01-01T00:00:00Z",
        model: "gpt",
        tokens_used: 10,
        price_usd: 0.001,
        created_at: "2025-01-01T00:00:00Z",
      },
    ]);

    // Mock recordEvent
    // @ts-expect-error - accessing private method for testing
    vi.spyOn(service, "recordEvent").mockResolvedValue(undefined);

    const request: GenerateFlashcardsRequest = {
      deck_id: "00000000-0000-0000-0000-000000000000",
      input_text: "test",
      max_flashcards: 1,
    };

    // Act
    const result = await service.generateFlashcards(request, "user-id");

    // Assert
    expect(result.generated_flashcards).toHaveLength(1);
    expect(result.generation_summary).toEqual({
      total_generated: 1,
      total_tokens: 10,
      total_cost_usd: 0.001,
      model_used: "gpt",
    });

    // Verify all methods were called using spies
    expect(vi.mocked(service["verifyDeck"])).toHaveBeenCalledWith("00000000-0000-0000-0000-000000000000", "user-id");
    expect(vi.mocked(service["checkBudgetLimits"])).toHaveBeenCalledWith("user-id");
    expect(vi.mocked(service["callAI"])).toHaveBeenCalledWith("test", 1);
    expect(vi.mocked(service["saveToDB"])).toHaveBeenCalledWith(
      fakeFlashcards,
      "00000000-0000-0000-0000-000000000000",
      fakeMeta
    );
    expect(vi.mocked(service["recordEvent"])).toHaveBeenCalledWith("user-id", fakeMeta);
  });
});
