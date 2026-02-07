import { describe, expect, it } from "vitest";
import {
  type CreatePromptInput,
  createPromptSchema,
  type Prompt,
  type UpdatePromptInput,
  updatePromptSchema,
} from "~/lib/prompts/schemas";

describe("Prompt Schemas", () => {
  describe("createPromptSchema", () => {
    it("should validate valid input", () => {
      const input: CreatePromptInput = {
        name: "Tech News Summary",
        template: "Summarize this article: {{title}} - {{description}}",
        is_default: false,
      };

      const result = createPromptSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(input);
      }
    });

    it("should validate input without is_default (defaults to false)", () => {
      const input = {
        name: "Tech News Summary",
        template: "Summarize: {{title}}",
      };

      const result = createPromptSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.is_default).toBe(false);
      }
    });

    it("should reject empty name", () => {
      const input = {
        name: "",
        template: "Summarize: {{title}}",
      };

      const result = createPromptSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it("should reject empty template", () => {
      const input = {
        name: "Test",
        template: "",
      };

      const result = createPromptSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it("should reject name exceeding max length", () => {
      const input = {
        name: "a".repeat(256),
        template: "Summarize: {{title}}",
      };

      const result = createPromptSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it("should reject template exceeding max length", () => {
      const input = {
        name: "Test",
        template: "a".repeat(10001),
      };

      const result = createPromptSchema.safeParse(input);

      expect(result.success).toBe(false);
    });
  });

  describe("updatePromptSchema", () => {
    it("should validate partial update with name only", () => {
      const input: UpdatePromptInput = {
        name: "Updated Name",
      };

      const result = updatePromptSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it("should validate partial update with template only", () => {
      const input: UpdatePromptInput = {
        template: "New template: {{title}}",
      };

      const result = updatePromptSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it("should validate partial update with is_default only", () => {
      const input: UpdatePromptInput = {
        is_default: true,
      };

      const result = updatePromptSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it("should validate full update", () => {
      const input: UpdatePromptInput = {
        name: "Updated Name",
        template: "Updated template: {{title}}",
        is_default: true,
      };

      const result = updatePromptSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(input);
      }
    });

    it("should reject empty name in update", () => {
      const input = {
        name: "",
      };

      const result = updatePromptSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it("should reject empty template in update", () => {
      const input = {
        template: "",
      };

      const result = updatePromptSchema.safeParse(input);

      expect(result.success).toBe(false);
    });
  });
});
