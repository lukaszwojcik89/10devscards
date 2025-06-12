import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import type {
  CreateDeckCommand,
  UpdateDeckCommand,
  DeleteDeckCommand,
  DeckWithCounts,
  DeckListResponseDTO,
  DeckDetailResponseDTO,
  CreateDeckResponseDTO,
  DeleteDeckResponseDTO,
} from "@/types";
import { createDeckRequestSchema, updateDeckRequestSchema } from "./deck.zod";

/**
 * Service for handling deck operations
 * Includes CRUD operations, ownership validation, and computed fields
 */
export class DeckService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * List all decks for a user with pagination and filtering
   * @param userId - User ID to filter decks
   * @param options - Pagination and filtering options
   */
  async listUserDecks(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      search?: string;
    } = {}
  ): Promise<DeckListResponseDTO> {
    const { limit = 20, offset = 0, search } = options;

    let query = this.supabase
      .from("decks")
      .select(
        `
        *,
        flashcard_count:flashcards(count),
        pending_count:flashcards(count).eq(status, 'pending')
        `,
        { count: "exact" }
      )
      .eq("owner_id", userId)
      .eq("deleted_at", null)
      .order("created_at", { ascending: false });

    // Add search filter if provided
    if (search && search.trim()) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Add pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch decks: ${error.message}`);
    }

    // Transform data to include computed counts
    const decksWithCounts: DeckWithCounts[] = (data || []).map((deck) => ({
      ...deck,
      flashcard_count: deck.flashcard_count?.[0]?.count || 0,
      pending_count: deck.pending_count?.[0]?.count || 0,
    }));

    return {
      data: decksWithCounts,
      pagination: {
        total: count || 0,
        limit,
        offset,
        has_more: (count || 0) > offset + limit,
      },
    };
  }

  /**
   * Get a single deck by slug for a specific user
   * @param slug - Deck slug
   * @param userId - User ID for ownership validation
   */
  async getDeckBySlug(slug: string, userId: string): Promise<DeckDetailResponseDTO> {
    const { data, error } = await this.supabase
      .from("decks")
      .select(
        `
        *,
        flashcard_count:flashcards(count),
        pending_count:flashcards(count).eq(status, 'pending')
        `
      )
      .eq("slug", slug)
      .eq("owner_id", userId)
      .eq("deleted_at", null)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        throw new Error("Deck not found");
      }
      throw new Error(`Failed to fetch deck: ${error.message}`);
    }

    // Transform data to include computed counts
    const deckWithCounts: DeckWithCounts = {
      ...data,
      flashcard_count: data.flashcard_count?.[0]?.count || 0,
      pending_count: data.pending_count?.[0]?.count || 0,
    };

    return {
      data: deckWithCounts,
    };
  }

  /**
   * Create a new deck
   * @param command - Deck creation data
   */
  async createDeck(command: CreateDeckCommand): Promise<CreateDeckResponseDTO> {
    // Validate input data
    const validated = createDeckRequestSchema.parse(command);

    // Check if slug already exists for this user
    const { data: existingDeck } = await this.supabase
      .from("decks")
      .select("id")
      .eq("slug", validated.slug)
      .eq("owner_id", command.owner_id)
      .eq("deleted_at", null)
      .single();

    if (existingDeck) {
      throw new Error("Deck with this slug already exists");
    }

    // Create the deck
    const { data, error } = await this.supabase
      .from("decks")
      .insert({
        ...validated,
        owner_id: command.owner_id,
      })
      .select(
        `
        *,
        flashcard_count:flashcards(count),
        pending_count:flashcards(count).eq(status, 'pending')
        `
      )
      .single();

    if (error) {
      throw new Error(`Failed to create deck: ${error.message}`);
    }

    // Transform data to include computed counts
    const deckWithCounts: DeckWithCounts = {
      ...data,
      flashcard_count: 0, // New deck has no flashcards
      pending_count: 0,
    };

    return {
      data: deckWithCounts,
    };
  }

  /**
   * Update deck information
   * @param command - Deck update data
   */
  async updateDeck(command: UpdateDeckCommand): Promise<DeckDetailResponseDTO> {
    // Validate input data
    const validated = updateDeckRequestSchema.parse(command);

    // Update the deck
    const { data, error } = await this.supabase
      .from("decks")
      .update({
        ...validated,
        updated_at: new Date().toISOString(),
      })
      .eq("slug", command.slug)
      .eq("owner_id", command.owner_id)
      .eq("deleted_at", null)
      .select(
        `
        *,
        flashcard_count:flashcards(count),
        pending_count:flashcards(count).eq(status, 'pending')
        `
      )
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        throw new Error("Deck not found");
      }
      throw new Error(`Failed to update deck: ${error.message}`);
    }

    // Transform data to include computed counts
    const deckWithCounts: DeckWithCounts = {
      ...data,
      flashcard_count: data.flashcard_count?.[0]?.count || 0,
      pending_count: data.pending_count?.[0]?.count || 0,
    };

    return {
      data: deckWithCounts,
    };
  }

  /**
   * Soft delete a deck and all its flashcards
   * @param command - Deck deletion data
   */
  async deleteDeck(command: DeleteDeckCommand): Promise<DeleteDeckResponseDTO> {
    const now = new Date().toISOString();

    // Start a transaction to soft delete deck and flashcards
    const { error: deckError } = await this.supabase
      .from("decks")
      .update({
        deleted_at: now,
        updated_at: now,
      })
      .eq("slug", command.slug)
      .eq("owner_id", command.owner_id)
      .eq("deleted_at", null);

    if (deckError) {
      throw new Error(`Failed to delete deck: ${deckError.message}`);
    }

    // Also soft delete all flashcards in this deck
    const { error: flashcardsError } = await this.supabase
      .from("flashcards")
      .update({
        deleted_at: now,
        updated_at: now,
      })
      .eq("deck_id", command.slug)
      .eq("deleted_at", null);

    if (flashcardsError) {
      // Log warning but don't fail the deck deletion
      // TODO: Replace with proper logging service
      // console.warn("Failed to delete flashcards:", flashcardsError);
    }

    return {
      message: "Deck deleted successfully",
    };
  }

  /**
   * Generate a unique slug from deck name
   * @param name - Deck name
   * @param userId - User ID for uniqueness check
   */
  async generateUniqueSlug(name: string, userId: string): Promise<string> {
    const baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/(^-|-$)/g, "");

    let slug = baseSlug;
    let counter = 1;

    // Check for uniqueness
    while (counter < 100) {
      const { data } = await this.supabase
        .from("decks")
        .select("id")
        .eq("slug", slug)
        .eq("owner_id", userId)
        .eq("deleted_at", null)
        .single();

      if (!data) {
        return slug; // Slug is unique
      }

      // Try with counter
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Fallback with timestamp
    return `${baseSlug}-${Date.now()}`;
  }
}
