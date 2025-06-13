import { describe, it, expect } from "vitest";
import { createDeckRequestSchema, updateDeckRequestSchema, deckListQuerySchema } from "./deck.zod";

describe("Deck Validation Schemas", () => {
  describe("createDeckRequestSchema", () => {
    it("should validate valid deck creation data", () => {
      // Arrange
      const validData = {
        slug: "typescript-basics",
        name: "TypeScript Basics",
        description: "Learn TypeScript fundamentals",
      };

      // Act
      const result = createDeckRequestSchema.parse(validData);

      // Assert
      expect(result).toEqual(validData);
    });

    it("should trim whitespace from name and description", () => {
      // Arrange
      const dataWithWhitespace = {
        slug: "typescript-basics",
        name: "  TypeScript Basics  ",
        description: "  Learn TypeScript fundamentals  ",
      };

      // Act
      const result = createDeckRequestSchema.parse(dataWithWhitespace);

      // Assert
      expect(result).toEqual({
        slug: "typescript-basics",
        name: "TypeScript Basics",
        description: "Learn TypeScript fundamentals",
      });
    });

    it("should convert empty description to null", () => {
      // Arrange
      const dataWithEmptyDescription = {
        slug: "typescript-basics",
        name: "TypeScript Basics",
        description: "   ",
      };

      // Act
      const result = createDeckRequestSchema.parse(dataWithEmptyDescription);

      // Assert
      expect(result.description).toBeNull();
    });

    it("should handle missing description", () => {
      // Arrange
      const dataWithoutDescription = {
        slug: "typescript-basics",
        name: "TypeScript Basics",
      };

      // Act
      const result = createDeckRequestSchema.parse(dataWithoutDescription);

      // Assert
      expect(result.description).toBeNull();
    });

    describe("slug validation", () => {
      it("should reject empty slug", () => {
        // Arrange
        const invalidData = {
          slug: "",
          name: "TypeScript Basics",
        };

        // Act & Assert
        expect(() => createDeckRequestSchema.parse(invalidData)).toThrow("Slug is required");
      });

      it("should reject slug with uppercase letters", () => {
        // Arrange
        const invalidData = {
          slug: "TypeScript-Basics",
          name: "TypeScript Basics",
        };

        // Act & Assert
        expect(() => createDeckRequestSchema.parse(invalidData)).toThrow(
          "Slug must contain only lowercase letters, numbers, and hyphens"
        );
      });

      it("should reject slug with special characters", () => {
        // Arrange
        const invalidData = {
          slug: "typescript@basics",
          name: "TypeScript Basics",
        };

        // Act & Assert
        expect(() => createDeckRequestSchema.parse(invalidData)).toThrow(
          "Slug must contain only lowercase letters, numbers, and hyphens"
        );
      });

      it("should reject slug starting with hyphen", () => {
        // Arrange
        const invalidData = {
          slug: "-typescript-basics",
          name: "TypeScript Basics",
        };

        // Act & Assert
        expect(() => createDeckRequestSchema.parse(invalidData)).toThrow("Slug cannot start or end with a hyphen");
      });

      it("should reject slug ending with hyphen", () => {
        // Arrange
        const invalidData = {
          slug: "typescript-basics-",
          name: "TypeScript Basics",
        };

        // Act & Assert
        expect(() => createDeckRequestSchema.parse(invalidData)).toThrow("Slug cannot start or end with a hyphen");
      });

      it("should reject slug that is too long", () => {
        // Arrange
        const longSlug = "a".repeat(101);
        const invalidData = {
          slug: longSlug,
          name: "TypeScript Basics",
        };

        // Act & Assert
        expect(() => createDeckRequestSchema.parse(invalidData)).toThrow("Slug must be less than 100 characters");
      });
    });

    describe("name validation", () => {
      it("should reject empty name", () => {
        // Arrange
        const invalidData = {
          slug: "typescript-basics",
          name: "",
        };

        // Act & Assert
        expect(() => createDeckRequestSchema.parse(invalidData)).toThrow("Name is required");
      });

      it("should reject name with only whitespace", () => {
        // Arrange
        const invalidData = {
          slug: "typescript-basics",
          name: "   ",
        };

        // Act & Assert
        expect(() => createDeckRequestSchema.parse(invalidData)).toThrow("Name is required");
      });

      it("should reject name that is too long", () => {
        // Arrange
        const longName = "a".repeat(256);
        const invalidData = {
          slug: "typescript-basics",
          name: longName,
        };

        // Act & Assert
        expect(() => createDeckRequestSchema.parse(invalidData)).toThrow("Name must be less than 255 characters");
      });
    });

    describe("description validation", () => {
      it("should reject description that is too long", () => {
        // Arrange
        const longDescription = "a".repeat(1001);
        const invalidData = {
          slug: "typescript-basics",
          name: "TypeScript Basics",
          description: longDescription,
        };

        // Act & Assert
        expect(() => createDeckRequestSchema.parse(invalidData)).toThrow(
          "Description must be less than 1000 characters"
        );
      });
    });
  });

  describe("updateDeckRequestSchema", () => {
    it("should validate valid update data", () => {
      // Arrange
      const validData = {
        name: "Advanced TypeScript",
        description: "Advanced TypeScript concepts",
      };

      // Act
      const result = updateDeckRequestSchema.parse(validData);

      // Assert
      expect(result).toEqual(validData);
    });

    it("should allow partial updates", () => {
      // Arrange
      const partialData = {
        name: "Advanced TypeScript",
      };

      // Act
      const result = updateDeckRequestSchema.parse(partialData);

      // Assert
      expect(result).toEqual(partialData);
    });

    it("should trim whitespace from name and description", () => {
      // Arrange
      const dataWithWhitespace = {
        name: "  Advanced TypeScript  ",
        description: "  Advanced concepts  ",
      };

      // Act
      const result = updateDeckRequestSchema.parse(dataWithWhitespace);

      // Assert
      expect(result).toEqual({
        name: "Advanced TypeScript",
        description: "Advanced concepts",
      });
    });

    it("should convert empty description to null", () => {
      // Arrange
      const dataWithEmptyDescription = {
        name: "Advanced TypeScript",
        description: "   ",
      };

      // Act
      const result = updateDeckRequestSchema.parse(dataWithEmptyDescription);

      // Assert
      expect(result.description).toBeNull();
    });

    it("should reject empty name", () => {
      // Arrange
      const invalidData = {
        name: "",
      };

      // Act & Assert
      expect(() => updateDeckRequestSchema.parse(invalidData)).toThrow("Name cannot be empty");
    });

    it("should reject name with only whitespace", () => {
      // Arrange
      const invalidData = {
        name: "   ",
      };

      // Act & Assert
      expect(() => updateDeckRequestSchema.parse(invalidData)).toThrow("Name cannot be empty");
    });

    it("should reject name that is too long", () => {
      // Arrange
      const longName = "a".repeat(256);
      const invalidData = {
        name: longName,
      };

      // Act & Assert
      expect(() => updateDeckRequestSchema.parse(invalidData)).toThrow("Name must be less than 255 characters");
    });

    it("should reject description that is too long", () => {
      // Arrange
      const longDescription = "a".repeat(1001);
      const invalidData = {
        description: longDescription,
      };

      // Act & Assert
      expect(() => updateDeckRequestSchema.parse(invalidData)).toThrow("Description must be less than 1000 characters");
    });
  });

  describe("deckListQuerySchema", () => {
    it("should validate valid query parameters", () => {
      // Arrange
      const validQuery = {
        limit: "10",
        offset: "20",
        search: "typescript",
      };

      // Act
      const result = deckListQuerySchema.parse(validQuery);

      // Assert
      expect(result).toEqual({
        limit: 10,
        offset: 20,
        search: "typescript",
      });
    });

    it("should use default values for missing parameters", () => {
      // Arrange
      const emptyQuery = {};

      // Act
      const result = deckListQuerySchema.parse(emptyQuery);

      // Assert
      expect(result).toEqual({
        limit: 20,
        offset: 0,
        search: undefined,
      });
    });

    it("should convert string numbers to integers", () => {
      // Arrange
      const stringQuery = {
        limit: "5",
        offset: "15",
      };

      // Act
      const result = deckListQuerySchema.parse(stringQuery);

      // Assert
      expect(result.limit).toBe(5);
      expect(result.offset).toBe(15);
    });

    it("should reject limit below 1", () => {
      // Arrange
      const invalidQuery = {
        limit: "0",
      };

      // Act & Assert
      expect(() => deckListQuerySchema.parse(invalidQuery)).toThrow("Limit must be between 1 and 100");
    });

    it("should reject limit above 100", () => {
      // Arrange
      const invalidQuery = {
        limit: "101",
      };

      // Act & Assert
      expect(() => deckListQuerySchema.parse(invalidQuery)).toThrow("Limit must be between 1 and 100");
    });

    it("should reject negative offset", () => {
      // Arrange
      const invalidQuery = {
        offset: "-1",
      };

      // Act & Assert
      expect(() => deckListQuerySchema.parse(invalidQuery)).toThrow("Offset must be non-negative");
    });

    it("should reject search string that is too long", () => {
      // Arrange
      const longSearch = "a".repeat(256);
      const invalidQuery = {
        search: longSearch,
      };

      // Act & Assert
      expect(() => deckListQuerySchema.parse(invalidQuery)).toThrow("Search must be less than 255 characters");
    });

    it("should trim whitespace from search", () => {
      // Arrange
      const queryWithWhitespace = {
        search: "  typescript  ",
      };

      // Act
      const result = deckListQuerySchema.parse(queryWithWhitespace);

      // Assert
      expect(result.search).toBe("typescript");
    });

    it("should convert empty search to undefined", () => {
      // Arrange
      const queryWithEmptySearch = {
        search: "   ",
      };

      // Act
      const result = deckListQuerySchema.parse(queryWithEmptySearch);

      // Assert
      expect(result.search).toBeUndefined();
    });
  });
});
