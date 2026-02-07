import { describe, expect, it } from "vitest";
import { settingsFormSchema, settingsSchema } from "~/lib/settings/schemas";

describe("settingsSchema", () => {
  it("should accept valid retention days (7)", () => {
    const result = settingsSchema.safeParse({ article_retention_days: 7 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.article_retention_days).toBe(7);
    }
  });

  it("should accept minimum retention days (1)", () => {
    const result = settingsSchema.safeParse({ article_retention_days: 1 });
    expect(result.success).toBe(true);
  });

  it("should accept maximum retention days (365)", () => {
    const result = settingsSchema.safeParse({ article_retention_days: 365 });
    expect(result.success).toBe(true);
  });

  it("should reject retention days less than 1", () => {
    const result = settingsSchema.safeParse({ article_retention_days: 0 });
    expect(result.success).toBe(false);
  });

  it("should reject retention days greater than 365", () => {
    const result = settingsSchema.safeParse({ article_retention_days: 366 });
    expect(result.success).toBe(false);
  });

  it("should reject non-integer values", () => {
    const result = settingsSchema.safeParse({ article_retention_days: 7.5 });
    expect(result.success).toBe(false);
  });

  it("should reject negative values", () => {
    const result = settingsSchema.safeParse({ article_retention_days: -1 });
    expect(result.success).toBe(false);
  });
});

describe("settingsFormSchema", () => {
  it("should convert string to number", () => {
    const result = settingsFormSchema.safeParse({ article_retention_days: "7" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.article_retention_days).toBe(7);
    }
  });

  it("should accept number directly", () => {
    const result = settingsFormSchema.safeParse({ article_retention_days: 14 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.article_retention_days).toBe(14);
    }
  });

  it("should reject empty string", () => {
    const result = settingsFormSchema.safeParse({ article_retention_days: "" });
    expect(result.success).toBe(false);
  });

  it("should reject non-numeric string", () => {
    const result = settingsFormSchema.safeParse({ article_retention_days: "abc" });
    expect(result.success).toBe(false);
  });

  it("should reject string values outside valid range", () => {
    const result = settingsFormSchema.safeParse({ article_retention_days: "400" });
    expect(result.success).toBe(false);
  });

  it("should reject decimal string", () => {
    const result = settingsFormSchema.safeParse({ article_retention_days: "7.5" });
    expect(result.success).toBe(false);
  });
});
