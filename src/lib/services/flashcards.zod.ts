import { z } from "zod";

/**
 * Zod schema for AI flashcard generation request validation
 * Validates deck_id, input_text, and max_flashcards according to API specification
 */
export const generateFlashcardsRequestSchema = z.object({
  deck_id: z.string().uuid("deck_id must be a valid UUID").min(1, "deck_id is required"),

  input_text: z.string().min(1, "input_text is required").max(2000, "input_text too long").trim(),

  max_flashcards: z
    .number()
    .int("max_flashcards must be an integer")
    .min(1, "max_flashcards must be at least 1")
    .max(10, "max_flashcards cannot exceed 10"),
});

export type GenerateFlashcardsRequestSchema = z.infer<typeof generateFlashcardsRequestSchema>;
