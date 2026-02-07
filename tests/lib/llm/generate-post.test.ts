import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildPrompt,
  generatePost,
  replaceTemplateVariables,
} from "~/lib/llm/generate-post.server";
import type { ArticleContext } from "~/lib/llm/schemas";

// Mock the LLM client
vi.mock("~/lib/llm/llm-client.server", () => ({
  getLLMClient: vi.fn(() => ({
    provider: "openai",
    model: { modelId: "gpt-4o-mini" },
  })),
}));

// Mock AI SDK generateText
vi.mock("ai", () => ({
  generateText: vi.fn(() =>
    Promise.resolve({
      text: "Generated post content",
    }),
  ),
}));

describe("Generate Post", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("replaceTemplateVariables", () => {
    it("should replace all template variables", () => {
      const template =
        "Check out: {{title}}\n\n{{description}}\n\nLink: {{link}}\nPublished: {{publishedAt}}\nTags: {{matchedTags}}";
      const article: ArticleContext = {
        title: "New AI Model Released",
        description: "A breakthrough in AI technology",
        link: "https://example.com/article",
        publishedAt: "2026-02-07",
        matchedTags: ["AI", "Technology"],
      };

      const result = replaceTemplateVariables(template, article);

      expect(result).toContain("New AI Model Released");
      expect(result).toContain("A breakthrough in AI technology");
      expect(result).toContain("https://example.com/article");
      expect(result).toContain("2026-02-07");
      expect(result).toContain("AI, Technology");
    });

    it("should handle missing optional fields", () => {
      const template = "{{title}} - {{description}} - {{matchedTags}}";
      const article: ArticleContext = {
        title: "Test Article",
        link: "https://example.com",
      };

      const result = replaceTemplateVariables(template, article);

      expect(result).toContain("Test Article");
      expect(result).not.toContain("{{description}}");
      expect(result).not.toContain("{{matchedTags}}");
    });

    it("should handle empty matchedTags array", () => {
      const template = "Tags: {{matchedTags}}";
      const article: ArticleContext = {
        title: "Test",
        link: "https://example.com",
        matchedTags: [],
      };

      const result = replaceTemplateVariables(template, article);

      expect(result).toBe("Tags: ");
    });
  });

  describe("buildPrompt", () => {
    it("should build a proper prompt with template and article context", () => {
      const template = "Write a Slack post about: {{title}}";
      const article: ArticleContext = {
        title: "New Feature Announcement",
        description: "We released a new feature",
        link: "https://example.com/feature",
      };

      const prompt = buildPrompt(template, article);

      expect(prompt).toContain("New Feature Announcement");
      expect(prompt).toContain("We released a new feature");
      expect(prompt).toContain("https://example.com/feature");
    });
  });

  describe("generatePost", () => {
    it("should generate post content using LLM", async () => {
      const { generateText } = await import("ai");

      const result = await generatePost({
        template: "Summarize: {{title}}",
        article: {
          title: "AI News",
          link: "https://example.com",
        },
      });

      expect(generateText).toHaveBeenCalled();
      expect(result.text).toBe("Generated post content");
      expect(result.provider).toBe("openai");
    });
  });
});
