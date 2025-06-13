import { describe, it, expect, beforeEach, vi } from "vitest";
import { DeckService } from "./deck.service";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import type { CreateDeckCommand, UpdateDeckCommand, DeleteDeckCommand } from "@/types";

// Mock supabase client
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockOr = vi.fn();
const mockRange = vi.fn();
const mockOrder = vi.fn();
const mockSingle = vi.fn();

const createChainableMock = () => ({
  select: mockSelect,
  eq: mockEq,
  or: mockOr,
  range: mockRange,
  order: mockOrder,
  single: mockSingle,
});

const mockFrom = vi.fn(() => ({
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDelete,
}));

// Create proper chaining for all methods
mockSelect.mockImplementation(() => createChainableMock());
mockEq.mockImplementation(() => createChainableMock());
mockOr.mockImplementation(() => createChainableMock());
mockRange.mockImplementation(() => createChainableMock());
mockOrder.mockImplementation(() => createChainableMock());
mockInsert.mockImplementation(() => ({
  select: mockSelect,
  single: mockSingle,
}));
mockUpdate.mockImplementation(() => ({
  eq: mockEq,
}));

// Create a special mock for the update chain that ends with select
const mockUpdateChain = {
  eq: vi.fn().mockImplementation(() => mockUpdateChain),
  select: vi.fn().mockImplementation(() => ({
    single: mockSingle,
  })),
};

mockUpdate.mockImplementation(() => mockUpdateChain);

const mockSupabase = {
  from: mockFrom,
} as unknown as SupabaseClient<Database>;

describe("DeckService", () => {
  let service: DeckService;

  beforeEach(() => {
    service = new DeckService(mockSupabase);
    vi.clearAllMocks();

    // Reset all mock return values
    mockFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    });
  });

  describe("listUserDecks", () => {
    it("should list user decks with default pagination", async () => {
      // Arrange
      const userId = "user-123";
      const mockDecks = [
        {
          id: "deck-1",
          slug: "typescript-basics",
          name: "TypeScript Basics",
          description: "Learn TypeScript fundamentals",
          owner_id: userId,
          created_at: "2025-01-01T00:00:00Z",
          updated_at: "2025-01-01T00:00:00Z",
          deleted_at: null,
          flashcard_count: [{ count: 10 }],
          pending_count: [{ count: 5 }],
        },
        {
          id: "deck-2",
          slug: "react-hooks",
          name: "React Hooks",
          description: "Master React Hooks",
          owner_id: userId,
          created_at: "2025-01-02T00:00:00Z",
          updated_at: "2025-01-02T00:00:00Z",
          deleted_at: null,
          flashcard_count: [{ count: 8 }],
          pending_count: [{ count: 3 }],
        },
      ];

      mockOrder.mockResolvedValue({
        data: mockDecks,
        error: null,
        count: 2,
      });

      // Act
      const result = await service.listUserDecks(userId);

      // Assert
      expect(result).toEqual({
        data: [
          {
            ...mockDecks[0],
            flashcard_count: 10,
            pending_count: 5,
          },
          {
            ...mockDecks[1],
            flashcard_count: 8,
            pending_count: 3,
          },
        ],
        pagination: {
          total: 2,
          limit: 20,
          offset: 0,
          has_more: false,
        },
      });

      expect(mockFrom).toHaveBeenCalledWith("decks");
      expect(mockEq).toHaveBeenCalledWith("owner_id", userId);
      expect(mockEq).toHaveBeenCalledWith("deleted_at", null);
      expect(mockRange).toHaveBeenCalledWith(0, 19);
    });

    it("should apply search filter when provided", async () => {
      // Arrange
      const userId = "user-123";
      const searchTerm = "typescript";

      mockOrder.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      // Act
      await service.listUserDecks(userId, { search: searchTerm });

      // Assert
      expect(mockOr).toHaveBeenCalledWith(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    });

    it("should handle custom pagination", async () => {
      // Arrange
      const userId = "user-123";
      const limit = 5;
      const offset = 10;

      mockOrder.mockResolvedValue({
        data: [],
        error: null,
        count: 25,
      });

      // Act
      const result = await service.listUserDecks(userId, { limit, offset });

      // Assert
      expect(mockRange).toHaveBeenCalledWith(10, 14);
      expect(result.pagination).toEqual({
        total: 25,
        limit: 5,
        offset: 10,
        has_more: true,
      });
    });

    it("should throw error when database query fails", async () => {
      // Arrange
      const userId = "user-123";
      const errorMessage = "Database connection failed";

      mockOrder.mockResolvedValue({
        data: null,
        error: { message: errorMessage },
        count: null,
      });

      // Act & Assert
      await expect(service.listUserDecks(userId)).rejects.toThrow(`Failed to fetch decks: ${errorMessage}`);
    });
  });

  describe("getDeckBySlug", () => {
    it("should return deck details when found", async () => {
      // Arrange
      const slug = "typescript-basics";
      const userId = "user-123";
      const mockDeck = {
        id: "deck-1",
        slug,
        name: "TypeScript Basics",
        description: "Learn TypeScript fundamentals",
        owner_id: userId,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
        deleted_at: null,
        flashcard_count: [{ count: 10 }],
        pending_count: [{ count: 5 }],
      };

      mockSingle.mockResolvedValue({
        data: mockDeck,
        error: null,
      });

      // Act
      const result = await service.getDeckBySlug(slug, userId);

      // Assert
      expect(result).toEqual({
        data: {
          ...mockDeck,
          flashcard_count: 10,
          pending_count: 5,
        },
      });

      expect(mockEq).toHaveBeenCalledWith("slug", slug);
      expect(mockEq).toHaveBeenCalledWith("owner_id", userId);
      expect(mockEq).toHaveBeenCalledWith("deleted_at", null);
    });

    it("should throw error when deck not found", async () => {
      // Arrange
      const slug = "non-existent-deck";
      const userId = "user-123";

      mockSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      // Act & Assert
      await expect(service.getDeckBySlug(slug, userId)).rejects.toThrow("Deck not found");
    });

    it("should throw error when database query fails", async () => {
      // Arrange
      const slug = "typescript-basics";
      const userId = "user-123";
      const errorMessage = "Database error";

      mockSingle.mockResolvedValue({
        data: null,
        error: { message: errorMessage },
      });

      // Act & Assert
      await expect(service.getDeckBySlug(slug, userId)).rejects.toThrow(`Failed to fetch deck: ${errorMessage}`);
    });
  });

  describe("createDeck", () => {
    it("should create deck successfully", async () => {
      // Arrange
      const command: CreateDeckCommand = {
        slug: "typescript-basics",
        name: "TypeScript Basics",
        description: "Learn TypeScript fundamentals",
        owner_id: "user-123",
      };

      const mockCreatedDeck = {
        id: "deck-1",
        ...command,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
        deleted_at: null,
      };

      // Mock the check for existing deck (should return null/error for no existing deck)
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116" },
      });

      // Mock the deck creation
      mockSingle.mockResolvedValueOnce({
        data: mockCreatedDeck,
        error: null,
      });

      // Act
      const result = await service.createDeck(command);

      // Assert
      expect(result).toEqual(mockCreatedDeck);
      expect(mockFrom).toHaveBeenCalledWith("decks");
    });

    it("should throw validation error for invalid data", async () => {
      // Arrange
      const invalidCommand = {
        slug: "", // Invalid: empty slug
        name: "TypeScript Basics",
        description: "Learn TypeScript fundamentals",
        owner_id: "user-123",
      } as CreateDeckCommand;

      // Act & Assert
      await expect(service.createDeck(invalidCommand)).rejects.toThrow();
    });

    it("should throw error when deck creation fails", async () => {
      // Arrange
      const command: CreateDeckCommand = {
        slug: "typescript-basics",
        name: "TypeScript Basics",
        description: "Learn TypeScript fundamentals",
        owner_id: "user-123",
      };

      const errorMessage = "Slug already exists";
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: errorMessage },
      });

      // Act & Assert
      await expect(service.createDeck(command)).rejects.toThrow(`Failed to create deck: ${errorMessage}`);
    });
  });

  describe("updateDeck", () => {
    it("should update deck successfully", async () => {
      // Arrange
      const command: UpdateDeckCommand = {
        slug: "typescript-basics",
        owner_id: "user-123",
        name: "Advanced TypeScript",
        description: "Advanced TypeScript concepts",
      };

      const mockUpdatedDeck = {
        id: "deck-1",
        slug: "typescript-basics",
        name: "Advanced TypeScript",
        description: "Advanced TypeScript concepts",
        owner_id: "user-123",
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T12:00:00Z",
        deleted_at: null,
        flashcard_count: [{ count: 10 }],
        pending_count: [{ count: 5 }],
      };

      mockSingle.mockResolvedValue({
        data: mockUpdatedDeck,
        error: null,
      });

      // Act
      const result = await service.updateDeck(command);

      // Assert
      expect(result).toEqual({
        ...mockUpdatedDeck,
        flashcard_count: 10,
        pending_count: 5,
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        name: command.name,
        description: command.description,
      });
      expect(mockEq).toHaveBeenCalledWith("slug", command.slug);
      expect(mockEq).toHaveBeenCalledWith("owner_id", command.owner_id);
    });

    it("should throw validation error for invalid updates", async () => {
      // Arrange
      const invalidCommand = {
        slug: "typescript-basics",
        owner_id: "user-123",
        name: "", // Invalid: empty name
      } as UpdateDeckCommand;

      // Act & Assert
      await expect(service.updateDeck(invalidCommand)).rejects.toThrow();
    });

    it("should throw error when deck not found for update", async () => {
      // Arrange
      const command: UpdateDeckCommand = {
        slug: "non-existent-deck",
        owner_id: "user-123",
        name: "New Name",
      };

      mockSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      // Act & Assert
      await expect(service.updateDeck(command)).rejects.toThrow(
        "Deck not found or you don't have permission to update it"
      );
    });
  });

  describe("deleteDeck", () => {
    it("should soft delete deck successfully", async () => {
      // Arrange
      const command: DeleteDeckCommand = {
        slug: "typescript-basics",
        owner_id: "user-123",
      };

      // Mock the update to return successful deletion
      mockUpdateChain.select.mockResolvedValue({
        data: [{ id: "deck-1" }], // Array with one affected row
        error: null,
      });

      // Act
      const result = await service.deleteDeck(command);

      // Assert
      expect(result).toEqual({ message: "Deck deleted successfully" });
    });

    it("should throw error when deck not found for deletion", async () => {
      // Arrange
      const command: DeleteDeckCommand = {
        slug: "non-existent-deck",
        owner_id: "user-123",
      };

      mockSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      // Act & Assert
      await expect(service.deleteDeck(command)).rejects.toThrow(
        "Deck not found or you don't have permission to delete it"
      );
    });

    it("should throw error when deletion fails", async () => {
      // Arrange
      const command: DeleteDeckCommand = {
        slug: "typescript-basics",
        owner_id: "user-123",
      };

      const errorMessage = "Database error";
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: errorMessage },
      });

      // Act & Assert
      await expect(service.deleteDeck(command)).rejects.toThrow(`Failed to delete deck: ${errorMessage}`);
    });
  });

  describe("generateUniqueSlug", () => {
    it("should return original slug when available", async () => {
      // Arrange
      const name = "TypeScript Basics";
      const userId = "user-123";
      const expectedSlug = "typescript-basics";

      mockSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      // Act
      const result = await service.generateUniqueSlug(name, userId);

      // Assert
      expect(result).toBe(expectedSlug);
    });

    it("should append number when slug already exists", async () => {
      // Arrange
      const name = "TypeScript Basics";
      const userId = "user-123";

      // Mock first call (slug exists)
      mockSingle
        .mockResolvedValueOnce({
          data: { id: "existing-deck" },
          error: null,
        })
        // Mock second call (slug-2 is available)
        .mockResolvedValueOnce({
          data: null,
          error: null,
        });

      // Act
      const result = await service.generateUniqueSlug(name, userId);

      // Assert
      expect(result).toBe("typescript-basics-2");
    });

    it("should handle special characters in name", async () => {
      // Arrange
      const name = "C++ & Advanced Programming!";
      const userId = "user-123";

      mockSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      // Act
      const result = await service.generateUniqueSlug(name, userId);

      // Assert
      expect(result).toBe("c-advanced-programming");
      expect(result).toMatch(/^[a-z0-9-]+$/); // Should only contain lowercase letters, numbers, and hyphens
    });
  });
});
