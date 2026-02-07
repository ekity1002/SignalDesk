import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the AI SDK providers
vi.mock("@ai-sdk/openai", () => ({
  createOpenAI: vi.fn(() => {
    // Return a callable function that also has properties
    const modelFn = vi.fn((modelName: string) => ({ modelName, type: "openai" }));
    return modelFn;
  }),
}));

vi.mock("@ai-sdk/anthropic", () => ({
  createAnthropic: vi.fn(() => {
    const modelFn = vi.fn((modelName: string) => ({ modelName, type: "anthropic" }));
    return modelFn;
  }),
}));

describe("LLM Client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  describe("getLLMClient", () => {
    it("should return OpenAI client when provider is openai", async () => {
      vi.stubEnv("LLM_PROVIDER", "openai");
      vi.stubEnv("OPENAI_API_KEY", "test-openai-key");

      const { getLLMClient } = await import("~/lib/llm/llm-client.server");
      const result = getLLMClient();

      expect(result.provider).toBe("openai");
      expect(result.model).toBeDefined();
    });

    it("should return Anthropic client when provider is anthropic", async () => {
      vi.stubEnv("LLM_PROVIDER", "anthropic");
      vi.stubEnv("ANTHROPIC_API_KEY", "test-anthropic-key");

      const { getLLMClient } = await import("~/lib/llm/llm-client.server");
      const result = getLLMClient();

      expect(result.provider).toBe("anthropic");
      expect(result.model).toBeDefined();
    });

    it("should default to openai when LLM_PROVIDER is not set", async () => {
      vi.stubEnv("LLM_PROVIDER", "");
      vi.stubEnv("OPENAI_API_KEY", "test-openai-key");

      const { getLLMClient } = await import("~/lib/llm/llm-client.server");
      const result = getLLMClient();

      expect(result.provider).toBe("openai");
    });
  });
});
