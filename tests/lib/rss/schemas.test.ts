import { describe, expect, it } from "vitest";
import { createSourceSchema } from "~/lib/rss/schemas";

describe("createSourceSchema", () => {
  it("should validate valid source data", () => {
    const result = createSourceSchema.safeParse({
      name: "Tech News",
      url: "https://example.com/feed",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Tech News");
      expect(result.data.url).toBe("https://example.com/feed");
    }
  });

  it("should reject empty name", () => {
    const result = createSourceSchema.safeParse({
      name: "",
      url: "https://example.com/feed",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Source name is required");
    }
  });

  it("should reject name exceeding 100 characters", () => {
    const longName = "a".repeat(101);
    const result = createSourceSchema.safeParse({
      name: longName,
      url: "https://example.com/feed",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Source name must be at most 100 characters");
    }
  });

  it("should reject empty URL", () => {
    const result = createSourceSchema.safeParse({
      name: "Tech News",
      url: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("URL is required");
    }
  });

  it("should reject invalid URL", () => {
    const result = createSourceSchema.safeParse({
      name: "Tech News",
      url: "not-a-valid-url",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Please enter a valid URL");
    }
  });

  it("should reject missing fields", () => {
    const result = createSourceSchema.safeParse({});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("should accept URL with http protocol", () => {
    const result = createSourceSchema.safeParse({
      name: "Tech News",
      url: "http://example.com/feed",
    });

    expect(result.success).toBe(true);
  });
});
