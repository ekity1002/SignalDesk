import { describe, expect, it } from "vitest";
import { matchTags, type TagWithKeywords } from "~/lib/rss/tag-matcher";

const makeTags = (
  tags: { id: string; name: string; keywords: string[]; is_active?: boolean }[],
): TagWithKeywords[] =>
  tags.map((t) => ({
    id: t.id,
    name: t.name,
    is_active: t.is_active ?? true,
    created_at: "2026-01-01T00:00:00Z",
    keywords: t.keywords.map((kw, i) => ({
      id: `${t.id}-kw-${i}`,
      tag_id: t.id,
      keyword: kw,
    })),
  }));

describe("matchTags", () => {
  it("should return matching tags when keywords found in title", () => {
    const tags = makeTags([
      { id: "1", name: "AI", keywords: ["machine learning", "deep learning"] },
    ]);
    const result = matchTags("Introduction to Machine Learning", "", tags);
    expect(result).toEqual([{ id: "1", name: "AI" }]);
  });

  it("should return matching tags when keywords found in description", () => {
    const tags = makeTags([{ id: "1", name: "Cloud", keywords: ["AWS", "Azure"] }]);
    const result = matchTags("New Service Launched", "AWS announces new compute service", tags);
    expect(result).toEqual([{ id: "1", name: "Cloud" }]);
  });

  it("should match case-insensitively", () => {
    const tags = makeTags([{ id: "1", name: "AI", keywords: ["GPT"] }]);
    const result = matchTags("New gpt model released", "", tags);
    expect(result).toEqual([{ id: "1", name: "AI" }]);
  });

  it("should return multiple matching tags", () => {
    const tags = makeTags([
      { id: "1", name: "AI", keywords: ["machine learning"] },
      { id: "2", name: "Cloud", keywords: ["AWS"] },
    ]);
    const result = matchTags("AWS launches machine learning service", "", tags);
    expect(result).toHaveLength(2);
    expect(result).toContainEqual({ id: "1", name: "AI" });
    expect(result).toContainEqual({ id: "2", name: "Cloud" });
  });

  it("should return empty array when no keywords match", () => {
    const tags = makeTags([{ id: "1", name: "AI", keywords: ["machine learning"] }]);
    const result = matchTags("Cooking recipes for beginners", "Learn to cook pasta", tags);
    expect(result).toEqual([]);
  });

  it("should return empty array when tags list is empty", () => {
    const result = matchTags("Some title", "Some description", []);
    expect(result).toEqual([]);
  });

  it("should handle tags with no keywords", () => {
    const tags = makeTags([{ id: "1", name: "Empty", keywords: [] }]);
    const result = matchTags("Some title", "Some description", tags);
    expect(result).toEqual([]);
  });

  it("should handle empty title and description", () => {
    const tags = makeTags([{ id: "1", name: "AI", keywords: ["AI"] }]);
    const result = matchTags("", "", tags);
    expect(result).toEqual([]);
  });

  it("should handle null description", () => {
    const tags = makeTags([{ id: "1", name: "AI", keywords: ["AI"] }]);
    const result = matchTags("AI revolution", null, tags);
    expect(result).toEqual([{ id: "1", name: "AI" }]);
  });

  it("should match substring within words", () => {
    const tags = makeTags([{ id: "1", name: "React", keywords: ["React"] }]);
    const result = matchTags("ReactJS 19 released", "", tags);
    expect(result).toEqual([{ id: "1", name: "React" }]);
  });

  it("should not return duplicate tags", () => {
    const tags = makeTags([{ id: "1", name: "AI", keywords: ["AI", "artificial intelligence"] }]);
    const result = matchTags("AI and artificial intelligence news", "", tags);
    expect(result).toHaveLength(1);
    expect(result).toEqual([{ id: "1", name: "AI" }]);
  });

  it("should skip inactive tags", () => {
    const tags = makeTags([
      { id: "1", name: "AI", keywords: ["machine learning"], is_active: false },
    ]);
    const result = matchTags("Introduction to Machine Learning", "", tags);
    expect(result).toEqual([]);
  });

  it("should only match active tags", () => {
    const tags = makeTags([
      { id: "1", name: "AI", keywords: ["machine learning"], is_active: false },
      { id: "2", name: "Cloud", keywords: ["AWS"], is_active: true },
    ]);
    const result = matchTags("AWS and Machine Learning", "", tags);
    expect(result).toHaveLength(1);
    expect(result).toEqual([{ id: "2", name: "Cloud" }]);
  });

  it("should match all active tags", () => {
    const tags = makeTags([
      { id: "1", name: "AI", keywords: ["machine learning"], is_active: true },
      { id: "2", name: "Cloud", keywords: ["AWS"], is_active: true },
      { id: "3", name: "DevOps", keywords: ["CI/CD"], is_active: false },
    ]);
    const result = matchTags("AWS machine learning CI/CD pipeline", "", tags);
    expect(result).toHaveLength(2);
    expect(result).toContainEqual({ id: "1", name: "AI" });
    expect(result).toContainEqual({ id: "2", name: "Cloud" });
  });
});
