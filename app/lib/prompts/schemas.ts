import { z } from "zod";

export const createPromptSchema = z.object({
  name: z.string().min(1).max(255),
  template: z.string().min(1).max(10000),
  is_default: z.boolean().default(false),
});

export const updatePromptSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  template: z.string().min(1).max(10000).optional(),
  is_default: z.boolean().optional(),
});

export type CreatePromptInput = z.infer<typeof createPromptSchema>;
export type UpdatePromptInput = z.infer<typeof updatePromptSchema>;

export type Prompt = {
  id: string;
  name: string;
  template: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};
