import { z } from "zod";

/**
 * Validation schema for POST /api/decks request
 * Validates deck creation data
 */
export const createDeckRequestSchema = z.object({
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100, "Slug must be less than 100 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens")
    .refine((slug) => !slug.startsWith("-") && !slug.endsWith("-"), "Slug cannot start or end with a hyphen")
    .optional(), // Make slug optional

  name: z.string().trim().min(1, "Name is required").max(255, "Name must be less than 255 characters"),

  description: z
    .string()
    .max(1000, "Description must be less than 1000 characters")
    .optional()
    .nullable()
    .transform((desc) => desc?.trim() || null),
});

/**
 * Validation schema for PUT /api/decks/{slug} request
 * Validates deck update data (all fields optional)
 */
export const updateDeckRequestSchema = z.object({
  name: z.string().trim().min(1, "Name cannot be empty").max(255, "Name must be less than 255 characters").optional(),

  description: z
    .string()
    .max(1000, "Description must be less than 1000 characters")
    .optional()
    .transform((desc) => desc?.trim() || null),
});

/**
 * Validation schema for deck listing query parameters
 */
export const deckListQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .refine((val) => val >= 1 && val <= 100, "Limit must be between 1 and 100"),

  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0))
    .refine((val) => val >= 0, "Offset must be non-negative"),

  search: z
    .string()
    .max(255, "Search must be less than 255 characters")
    .optional()
    .transform((val) => val?.trim() || undefined),
});

// Export types inferred from schemas
export type CreateDeckRequest = z.infer<typeof createDeckRequestSchema>;
export type UpdateDeckRequest = z.infer<typeof updateDeckRequestSchema>;
export type DeckListQuery = z.infer<typeof deckListQuerySchema>;
