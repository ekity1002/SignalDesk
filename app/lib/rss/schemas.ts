import { z } from "zod";

export const createSourceSchema = z.object({
  name: z
    .string()
    .min(1, "Source name is required")
    .max(100, "Source name must be at most 100 characters"),
  url: z.string().min(1, "URL is required").url("Please enter a valid URL"),
});

export type CreateSourceFormData = z.infer<typeof createSourceSchema>;
