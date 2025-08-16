import { describe, it, expect } from "vitest";
import { generateFlashcardsRequestSchema } from "@/lib/services/flashcards.zod";
import { ZodError } from "zod";

describe("Flashcards Zod Validation", () => {
  describe("generateFlashcardsRequestSchema", () => {
    it("should accept valid generate flashcards request", () => {
      const validRequest = {
        deck_id: "12345678-1234-1234-1234-123456789012",
        input_text: "Learn TypeScript fundamentals including types, interfaces, and classes",
        max_cards: 5,
        difficulty: "intermediate" as const,
        context: "Programming course",
        language: "en" as const,
      };

      const result = generateFlashcardsRequestSchema.parse(validRequest);
      expect(result).toEqual(validRequest);
    });

    it("should accept CREATE_NEW deck_id", () => {
      const validRequest = {
        deck_id: "CREATE_NEW",
        input_text: "Learn React hooks",
        new_deck_name: "React Hooks Course",
        new_deck_description: "Complete guide to React hooks",
      };

      const result = generateFlashcardsRequestSchema.parse(validRequest);
      expect(result.deck_id).toBe("CREATE_NEW");
      expect(result.max_cards).toBe(5); // default value
      expect(result.difficulty).toBe("intermediate"); // default value
    });

    it("should accept any valid string for deck_id", () => {
      const validRequests = [
        {
          deck_id: "CREATE_NEW",
          input_text: "Some text",
        },
        {
          deck_id: "12345678-1234-1234-1234-123456789012",
          input_text: "Some text",
        },
        {
          deck_id: "custom-deck-id",
          input_text: "Some text",
        },
      ];

      validRequests.forEach((request) => {
        const result = generateFlashcardsRequestSchema.parse(request);
        expect(result.deck_id).toBe(request.deck_id);
      });
    });

    it("should reject empty input_text", () => {
      const invalidRequest = {
        deck_id: "CREATE_NEW",
        input_text: "",
      };

      expect(() => generateFlashcardsRequestSchema.parse(invalidRequest)).toThrow(ZodError);
    });

    it("should reject input_text longer than 2000 characters", () => {
      const invalidRequest = {
        deck_id: "CREATE_NEW",
        input_text: "a".repeat(2001),
      };

      expect(() => generateFlashcardsRequestSchema.parse(invalidRequest)).toThrow(ZodError);
    });

    it("should reject max_cards outside valid range", () => {
      const invalidRequestLow = {
        deck_id: "CREATE_NEW",
        input_text: "Some text",
        max_cards: 0,
      };

      const invalidRequestHigh = {
        deck_id: "CREATE_NEW",
        input_text: "Some text",
        max_cards: 21,
      };

      expect(() => generateFlashcardsRequestSchema.parse(invalidRequestLow)).toThrow(ZodError);
      expect(() => generateFlashcardsRequestSchema.parse(invalidRequestHigh)).toThrow(ZodError);
    });

    it("should reject invalid difficulty level", () => {
      const invalidRequest = {
        deck_id: "CREATE_NEW",
        input_text: "Some text",
        difficulty: "invalid-level",
      };

      expect(() => generateFlashcardsRequestSchema.parse(invalidRequest)).toThrow(ZodError);
    });

    it("should apply default values when not provided", () => {
      const minimalRequest = {
        deck_id: "CREATE_NEW",
        input_text: "Some text without optional fields",
      };

      const result = generateFlashcardsRequestSchema.parse(minimalRequest);
      expect(result.max_cards).toBe(5);
      expect(result.difficulty).toBe("intermediate");
      expect(result.language).toBe("pl");
    });

    it("should handle very long valid input gracefully", () => {
      const validRequest = {
        deck_id: "CREATE_NEW",
        input_text: "a".repeat(1999), // Just under the limit
        max_cards: 20,
      };

      const result = generateFlashcardsRequestSchema.parse(validRequest);
      expect(result.input_text).toHaveLength(1999);
    });

    it("should trim whitespace from input_text", () => {
      const requestWithWhitespace = {
        deck_id: "CREATE_NEW",
        input_text: "  Learn TypeScript basics  ",
      };

      const result = generateFlashcardsRequestSchema.parse(requestWithWhitespace);
      expect(result.input_text).toBe("Learn TypeScript basics");
    });

    it("should validate context and language fields", () => {
      const validRequest = {
        deck_id: "CREATE_NEW",
        input_text: "Learn Python",
        context: "University computer science course for beginners",
        language: "pl" as const,
      };

      const result = generateFlashcardsRequestSchema.parse(validRequest);
      expect(result.context).toBe("University computer science course for beginners");
      expect(result.language).toBe("pl");
    });

    it("should reject invalid language codes", () => {
      const invalidRequest = {
        deck_id: "CREATE_NEW",
        input_text: "Some text",
        language: "invalid-lang",
      };

      expect(() => generateFlashcardsRequestSchema.parse(invalidRequest)).toThrow(ZodError);
    });

    it("should reject context longer than 500 characters", () => {
      const invalidRequest = {
        deck_id: "CREATE_NEW",
        input_text: "Some text",
        context: "a".repeat(501),
      };

      expect(() => generateFlashcardsRequestSchema.parse(invalidRequest)).toThrow(ZodError);
    });

    it("should reject new_deck_name longer than 100 characters", () => {
      const invalidRequest = {
        deck_id: "CREATE_NEW",
        input_text: "Some text",
        new_deck_name: "a".repeat(101),
      };

      expect(() => generateFlashcardsRequestSchema.parse(invalidRequest)).toThrow(ZodError);
    });

    it("should reject new_deck_description longer than 500 characters", () => {
      const invalidRequest = {
        deck_id: "CREATE_NEW",
        input_text: "Some text",
        new_deck_description: "a".repeat(501),
      };

      expect(() => generateFlashcardsRequestSchema.parse(invalidRequest)).toThrow(ZodError);
    });

    it("should validate all supported language codes", () => {
      const supportedLanguages = ["pl", "en", "de", "fr", "es", "it"] as const;

      supportedLanguages.forEach((lang) => {
        const request = {
          deck_id: "CREATE_NEW",
          input_text: "Test content",
          language: lang,
        };

        const result = generateFlashcardsRequestSchema.parse(request);
        expect(result.language).toBe(lang);
      });
    });
  });
});
