import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

export type LLMProvider = "openai" | "anthropic";

export type LLMClient = {
  provider: LLMProvider;
  model: LanguageModel;
};

function getProvider(): LLMProvider {
  const provider = process.env.LLM_PROVIDER?.toLowerCase();
  if (provider === "anthropic") {
    return "anthropic";
  }
  return "openai";
}

export function getLLMClient(): LLMClient {
  const provider = getProvider();

  if (provider === "anthropic") {
    const anthropic = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    return {
      provider: "anthropic",
      model: anthropic("claude-sonnet-4-20250514"),
    };
  }

  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  return {
    provider: "openai",
    model: openai("gpt-4o-mini"),
  };
}
