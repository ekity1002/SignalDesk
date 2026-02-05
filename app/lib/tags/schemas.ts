import { z } from "zod";

const keywordsTransformer = (val: string) => {
  if (!val || val.trim() === "") {
    return [];
  }
  return val
    .split(",")
    .map((k) => k.trim())
    .filter((k) => k.length > 0);
};

const keywordsValidator = (keywords: string[]) => keywords.length <= 20;

export const createTagSchema = z.object({
  name: z
    .string()
    .min(1, "Tag name is required")
    .max(50, "Tag name must be at most 50 characters")
    .trim(),
  keywords: z
    .string()
    .default("")
    .transform(keywordsTransformer)
    .refine(keywordsValidator, { message: "Maximum 20 keywords allowed" }),
});

export const updateTagKeywordsSchema = z.object({
  tagId: z.string().uuid("Invalid tag ID"),
  keywords: z
    .string()
    .default("")
    .transform(keywordsTransformer)
    .refine(keywordsValidator, { message: "Maximum 20 keywords allowed" }),
});

export const createTagFormSchema = z.object({
  name: z
    .string()
    .min(1, "Tag name is required")
    .max(50, "Tag name must be at most 50 characters")
    .trim(),
  keywords: z.string(),
});

export type CreateTagFormData = z.infer<typeof createTagFormSchema>;
export type UpdateTagKeywordsFormData = z.infer<typeof updateTagKeywordsSchema>;
