import { z } from "zod";

export const settingsSchema = z.object({
  article_retention_days: z
    .number()
    .int("Retention days must be a whole number")
    .min(1, "Retention days must be at least 1")
    .max(365, "Retention days must be at most 365"),
});

export type Settings = z.infer<typeof settingsSchema>;

export const settingsFormSchema = z.object({
  article_retention_days: z
    .union([z.string(), z.number()])
    .transform((val, ctx) => {
      if (typeof val === "number") {
        return val;
      }
      if (val === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Retention days is required",
        });
        return z.NEVER;
      }
      const parsed = Number(val);
      if (Number.isNaN(parsed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Retention days must be a number",
        });
        return z.NEVER;
      }
      if (!Number.isInteger(parsed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Retention days must be a whole number",
        });
        return z.NEVER;
      }
      return parsed;
    })
    .pipe(
      z
        .number()
        .int("Retention days must be a whole number")
        .min(1, "Retention days must be at least 1")
        .max(365, "Retention days must be at most 365"),
    ),
});

export type SettingsFormData = z.infer<typeof settingsFormSchema>;
