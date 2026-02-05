import { describe, expect, it } from "vitest";
import { normalizeUrl } from "~/lib/rss/url-normalizer";

describe("normalizeUrl", () => {
  it("should return URL without tracking parameters", () => {
    const url = "https://example.com/article?utm_source=twitter&utm_medium=social&id=123";
    const result = normalizeUrl(url);
    expect(result).toBe("https://example.com/article?id=123");
  });

  it("should remove utm_* parameters", () => {
    const url = "https://example.com/page?utm_source=google&utm_medium=cpc&utm_campaign=spring";
    const result = normalizeUrl(url);
    expect(result).toBe("https://example.com/page");
  });

  it("should remove fbclid parameter", () => {
    const url = "https://example.com/post?fbclid=abc123&title=hello";
    const result = normalizeUrl(url);
    expect(result).toBe("https://example.com/post?title=hello");
  });

  it("should remove gclid parameter", () => {
    const url = "https://example.com/page?gclid=xyz789";
    const result = normalizeUrl(url);
    expect(result).toBe("https://example.com/page");
  });

  it("should remove ref parameter", () => {
    const url = "https://example.com/article?ref=homepage&category=tech";
    const result = normalizeUrl(url);
    expect(result).toBe("https://example.com/article?category=tech");
  });

  it("should sort remaining query parameters alphabetically", () => {
    const url = "https://example.com/page?z=1&a=2&m=3";
    const result = normalizeUrl(url);
    expect(result).toBe("https://example.com/page?a=2&m=3&z=1");
  });

  it("should remove trailing slash", () => {
    const url = "https://example.com/article/";
    const result = normalizeUrl(url);
    expect(result).toBe("https://example.com/article");
  });

  it("should not remove trailing slash from root path", () => {
    const url = "https://example.com/";
    const result = normalizeUrl(url);
    expect(result).toBe("https://example.com/");
  });

  it("should handle URL with no query parameters", () => {
    const url = "https://example.com/article";
    const result = normalizeUrl(url);
    expect(result).toBe("https://example.com/article");
  });

  it("should handle URL where all parameters are tracking params", () => {
    const url = "https://example.com/page?utm_source=x&fbclid=y&gclid=z&ref=w";
    const result = normalizeUrl(url);
    expect(result).toBe("https://example.com/page");
  });

  it("should return invalid URL as-is", () => {
    const invalidUrl = "not-a-valid-url";
    const result = normalizeUrl(invalidUrl);
    expect(result).toBe("not-a-valid-url");
  });

  it("should return empty string as-is", () => {
    const result = normalizeUrl("");
    expect(result).toBe("");
  });

  it("should handle URL with hash fragment", () => {
    const url = "https://example.com/article?utm_source=twitter#section1";
    const result = normalizeUrl(url);
    expect(result).toBe("https://example.com/article#section1");
  });
});
