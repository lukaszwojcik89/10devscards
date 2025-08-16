import { z } from "zod";

/**
 * Zod schema for AI flashcard generation request validation
 * Validates deck_id, input_text, and max_flashcards according to API specification
 */
export const generateFlashcardsRequestSchema = z.object({
  deck_id: z.string().min(1, "deck_id is required"), // Allow "CREATE_NEW" or UUID

  input_text: z.string().min(1, "input_text is required").max(2000, "input_text too long").trim(),

  max_cards: z
    .number()
    .int("max_cards must be an integer")
    .min(1, "max_cards must be at least 1")
    .max(20, "max_cards cannot exceed 20")
    .default(5),

  difficulty: z
    .enum(["beginner", "intermediate", "advanced"], {
      errorMap: () => ({ message: "difficulty must be one of: beginner, intermediate, advanced" }),
    })
    .default("intermediate"),

  context: z
    .string()
    .max(500, "context must be less than 500 characters")
    .optional()
    .transform((ctx) => ctx?.trim() || undefined),

  language: z
    .enum(["pl", "en", "de", "fr", "es", "it"], {
      errorMap: () => ({ message: "language must be one of: pl, en, de, fr, es, it" }),
    })
    .default("pl"),

  // Optional new deck data when deck_id is "CREATE_NEW"
  new_deck_name: z
    .string()
    .min(1, "new_deck_name is required when creating new deck")
    .max(100, "new_deck_name must be less than 100 characters")
    .optional(),

  new_deck_description: z.string().max(500, "new_deck_description must be less than 500 characters").optional(),
});

export type GenerateFlashcardsRequestSchema = z.infer<typeof generateFlashcardsRequestSchema>;
