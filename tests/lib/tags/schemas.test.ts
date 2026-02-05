import { describe, expect, it } from "vitest";
import { createTagSchema, updateTagKeywordsSchema } from "~/lib/tags/schemas";

describe("Tag Schemas", () => {
  describe("createTagSchema", () => {
    it("should validate valid tag data", () => {
      const validData = {
        name: "AI",
        keywords: "machine learning, deep learning, neural network",
      };

      const result = createTagSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("AI");
        expect(result.data.keywords).toEqual([
          "machine learning",
          "deep learning",
          "neural network",
        ]);
      }
    });

    it("should reject empty name", () => {
      const invalidData = {
        name: "",
        keywords: "test",
      };

      const result = createTagSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Tag name is required");
      }
    });

    it("should reject name longer than 50 characters", () => {
      const invalidData = {
        name: "a".repeat(51),
        keywords: "test",
      };

      const result = createTagSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Tag name must be at most 50 characters");
      }
    });

    it("should trim whitespace from name", () => {
      const data = {
        name: "  AI  ",
        keywords: "test",
      };

      const result = createTagSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("AI");
      }
    });

    it("should handle empty keywords string", () => {
      const data = {
        name: "AI",
        keywords: "",
      };

      const result = createTagSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.keywords).toEqual([]);
      }
    });

    it("should trim whitespace from keywords", () => {
      const data = {
        name: "AI",
        keywords: "  machine learning  ,  deep learning  ",
      };

      const result = createTagSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.keywords).toEqual(["machine learning", "deep learning"]);
      }
    });

    it("should reject more than 20 keywords", () => {
      const keywords = Array(21)
        .fill(0)
        .map((_, i) => `keyword${i}`)
        .join(",");
      const invalidData = {
        name: "AI",
        keywords,
      };

      const result = createTagSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Maximum 20 keywords allowed");
      }
    });

    it("should filter out empty keywords after split", () => {
      const data = {
        name: "AI",
        keywords: "machine learning,,deep learning,",
      };

      const result = createTagSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.keywords).toEqual(["machine learning", "deep learning"]);
      }
    });
  });

  describe("updateTagKeywordsSchema", () => {
    it("should validate valid update data", () => {
      const validData = {
        tagId: "550e8400-e29b-41d4-a716-446655440000",
        keywords: "machine learning, deep learning",
      };

      const result = updateTagKeywordsSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tagId).toBe("550e8400-e29b-41d4-a716-446655440000");
        expect(result.data.keywords).toEqual(["machine learning", "deep learning"]);
      }
    });

    it("should reject invalid UUID", () => {
      const invalidData = {
        tagId: "not-a-uuid",
        keywords: "test",
      };

      const result = updateTagKeywordsSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Invalid tag ID");
      }
    });

    it("should transform keywords string to array", () => {
      const data = {
        tagId: "550e8400-e29b-41d4-a716-446655440000",
        keywords: "a, b, c",
      };

      const result = updateTagKeywordsSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.keywords).toEqual(["a", "b", "c"]);
      }
    });

    it("should reject more than 20 keywords", () => {
      const keywords = Array(21)
        .fill(0)
        .map((_, i) => `keyword${i}`)
        .join(",");
      const invalidData = {
        tagId: "550e8400-e29b-41d4-a716-446655440000",
        keywords,
      };

      const result = updateTagKeywordsSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Maximum 20 keywords allowed");
      }
    });
  });
});
