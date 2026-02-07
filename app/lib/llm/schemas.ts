import { z } from "zod";

export const articleContextSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  link: z.string(),
  publishedAt: z.string().optional(),
  matchedTags: z.array(z.string()).optional(),
});

export type ArticleContext = z.infer<typeof articleContextSchema>;

export const generatePostInputSchema = z.object({
  template: z.string(),
  article: articleContextSchema,
});

export type GeneratePostInput = z.infer<typeof generatePostInputSchema>;

export type GeneratePostResult = {
  text: string;
  provider: string;
};
