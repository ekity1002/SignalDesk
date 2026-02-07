import { generateText } from "ai";
import { getLLMClient } from "./llm-client.server";
import type { ArticleContext, GeneratePostInput, GeneratePostResult } from "./schemas";

export function replaceTemplateVariables(template: string, article: ArticleContext): string {
  let result = template;

  result = result.replace(/\{\{title\}\}/g, article.title);
  result = result.replace(/\{\{description\}\}/g, article.description ?? "");
  result = result.replace(/\{\{link\}\}/g, article.link);
  result = result.replace(/\{\{publishedAt\}\}/g, article.publishedAt ?? "");
  result = result.replace(/\{\{matchedTags\}\}/g, article.matchedTags?.join(", ") ?? "");

  return result;
}

export function buildPrompt(template: string, article: ArticleContext): string {
  const filledTemplate = replaceTemplateVariables(template, article);

  return `You are a helpful assistant that creates Slack posts for sharing tech articles.

Based on the following template and article information, generate a concise and engaging Slack post.

Template:
${filledTemplate}

Article Information:
- Title: ${article.title}
- Description: ${article.description ?? "N/A"}
- Link: ${article.link}
- Published: ${article.publishedAt ?? "N/A"}
- Tags: ${article.matchedTags?.join(", ") ?? "N/A"}

Generate a Slack-friendly post that follows the template style. Keep it concise and professional.
Do not include any markdown formatting. Output only the post text.`;
}

export async function generatePost(input: GeneratePostInput): Promise<GeneratePostResult> {
  const { model, provider } = getLLMClient();
  const prompt = buildPrompt(input.template, input.article);

  const { text } = await generateText({
    model,
    prompt,
  });

  return {
    text,
    provider,
  };
}
