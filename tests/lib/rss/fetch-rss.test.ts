import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockParseURL } = vi.hoisted(() => ({
  mockParseURL: vi.fn(),
}));

// Mock dependencies
vi.mock("~/lib/rss/sources.server", () => ({
  getSources: vi.fn(),
}));

vi.mock("~/lib/rss/articles.server", () => ({
  articleExistsByCanonicalUrl: vi.fn(),
  createArticle: vi.fn(),
  attachTagsToArticle: vi.fn(),
  deleteArticle: vi.fn(),
}));

vi.mock("~/lib/tags/tags.server", () => ({
  getTags: vi.fn(),
}));

vi.mock("rss-parser", () => {
  return {
    default: class MockRssParser {
      parseURL = mockParseURL;
    },
  };
});

import {
  articleExistsByCanonicalUrl,
  attachTagsToArticle,
  createArticle,
  deleteArticle,
} from "~/lib/rss/articles.server";
import { fetchAllRssSources, fetchRssSource } from "~/lib/rss/fetch-rss.server";
import type { Source } from "~/lib/rss/sources.server";
import { getSources } from "~/lib/rss/sources.server";
import type { Tag } from "~/lib/tags/tags.server";
import { getTags } from "~/lib/tags/tags.server";

const mockSource: Source = {
  id: "source-1",
  name: "Tech Blog",
  url: "https://example.com/feed",
  is_active: true,
  created_at: "2026-02-01T00:00:00Z",
};

const mockTags: Tag[] = [
  {
    id: "tag-1",
    name: "AI",
    created_at: "2026-01-01T00:00:00Z",
    keywords: [{ id: "kw-1", tag_id: "tag-1", keyword: "machine learning" }],
  },
  {
    id: "tag-2",
    name: "Cloud",
    created_at: "2026-01-01T00:00:00Z",
    keywords: [{ id: "kw-2", tag_id: "tag-2", keyword: "AWS" }],
  },
];

const mockFeedItems = [
  {
    title: "New Machine Learning Framework",
    contentSnippet: "A new framework for machine learning released",
    link: "https://example.com/article1?utm_source=twitter",
    pubDate: "2026-02-01T10:00:00Z",
  },
  {
    title: "Cooking Tips",
    contentSnippet: "Best pasta recipes for beginners",
    link: "https://example.com/article2",
    pubDate: "2026-02-01T09:00:00Z",
  },
];

describe("fetchRssSource", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch and process RSS items from a source", async () => {
    mockParseURL.mockResolvedValue({ items: mockFeedItems });
    vi.mocked(articleExistsByCanonicalUrl).mockResolvedValue(false);
    vi.mocked(createArticle).mockResolvedValue({
      id: "new-article-1",
      title: "New Machine Learning Framework",
      description: "A new framework for machine learning released",
      link: "https://example.com/article1",
      canonical_url: "https://example.com/article1",
      published_at: "2026-02-01T10:00:00Z",
      source_id: "source-1",
      status: "visible",
      created_at: "2026-02-01T00:00:00Z",
      updated_at: "2026-02-01T00:00:00Z",
    });

    const result = await fetchRssSource(mockSource, mockTags);

    expect(result.sourceId).toBe("source-1");
    expect(result.sourceName).toBe("Tech Blog");
    expect(result.created).toBe(2);
    expect(result.skipped).toBe(0);
    expect(result.errors).toEqual([]);
  });

  it("should skip articles that already exist", async () => {
    mockParseURL.mockResolvedValue({ items: [mockFeedItems[0]] });
    vi.mocked(articleExistsByCanonicalUrl).mockResolvedValue(true);

    const result = await fetchRssSource(mockSource, mockTags);

    expect(result.created).toBe(0);
    expect(result.skipped).toBe(1);
    expect(createArticle).not.toHaveBeenCalled();
  });

  it("should handle parse errors gracefully", async () => {
    mockParseURL.mockRejectedValue(new Error("Network error"));

    const result = await fetchRssSource(mockSource, mockTags);

    expect(result.created).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("Network error");
  });

  it("should attach matching tags to created articles", async () => {
    mockParseURL.mockResolvedValue({ items: [mockFeedItems[0]] });
    vi.mocked(articleExistsByCanonicalUrl).mockResolvedValue(false);
    vi.mocked(createArticle).mockResolvedValue({
      id: "new-article-1",
      title: "New Machine Learning Framework",
      description: "A new framework for machine learning released",
      link: "https://example.com/article1",
      canonical_url: "https://example.com/article1",
      published_at: "2026-02-01T10:00:00Z",
      source_id: "source-1",
      status: "visible",
      created_at: "2026-02-01T00:00:00Z",
      updated_at: "2026-02-01T00:00:00Z",
    });

    await fetchRssSource(mockSource, mockTags);

    expect(attachTagsToArticle).toHaveBeenCalledWith("new-article-1", ["tag-1"]);
  });

  it("should set status to excluded when no tags match", async () => {
    mockParseURL.mockResolvedValue({ items: [mockFeedItems[1]] });
    vi.mocked(articleExistsByCanonicalUrl).mockResolvedValue(false);
    vi.mocked(createArticle).mockResolvedValue({
      id: "new-article-2",
      title: "Cooking Tips",
      description: "Best pasta recipes",
      link: "https://example.com/article2",
      canonical_url: "https://example.com/article2",
      published_at: "2026-02-01T09:00:00Z",
      source_id: "source-1",
      status: "excluded",
      created_at: "2026-02-01T00:00:00Z",
      updated_at: "2026-02-01T00:00:00Z",
    });

    await fetchRssSource(mockSource, mockTags);

    expect(createArticle).toHaveBeenCalledWith(expect.objectContaining({ status: "excluded" }));
    expect(attachTagsToArticle).not.toHaveBeenCalled();
  });

  it("should rollback article when tag attachment fails", async () => {
    mockParseURL.mockResolvedValue({ items: [mockFeedItems[0]] });
    vi.mocked(articleExistsByCanonicalUrl).mockResolvedValue(false);
    vi.mocked(createArticle).mockResolvedValue({
      id: "new-article-1",
      title: "New Machine Learning Framework",
      description: "A new framework for machine learning released",
      link: "https://example.com/article1",
      canonical_url: "https://example.com/article1",
      published_at: "2026-02-01T10:00:00Z",
      source_id: "source-1",
      status: "visible",
      created_at: "2026-02-01T00:00:00Z",
      updated_at: "2026-02-01T00:00:00Z",
    });
    vi.mocked(attachTagsToArticle).mockRejectedValue(new Error("DB Error"));

    const result = await fetchRssSource(mockSource, mockTags);

    expect(deleteArticle).toHaveBeenCalledWith("new-article-1");
    expect(result.created).toBe(0);
    expect(result.errors).toHaveLength(1);
  });

  it("should handle URLs with Japanese characters", async () => {
    const sourceWithJapaneseUrl: Source = {
      ...mockSource,
      url: "https://news.google.com/rss/search?q=(Nikon%20OR%20ニコン)%20when:1d&hl=ja",
    };

    mockParseURL.mockResolvedValue({ items: [] });

    const result = await fetchRssSource(sourceWithJapaneseUrl, mockTags);

    // The URL should be properly encoded before being passed to parseURL
    expect(mockParseURL).toHaveBeenCalledWith(
      "https://news.google.com/rss/search?q=(Nikon%20OR%20%E3%83%8B%E3%82%B3%E3%83%B3)%20when:1d&hl=ja"
    );
    expect(result.errors).toEqual([]);
  });
});

describe("fetchAllRssSources", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch from all active sources", async () => {
    const inactiveSource: Source = {
      ...mockSource,
      id: "source-2",
      is_active: false,
    };

    vi.mocked(getSources).mockResolvedValue([mockSource, inactiveSource]);
    vi.mocked(getTags).mockResolvedValue(mockTags);
    mockParseURL.mockResolvedValue({ items: [] });

    const result = await fetchAllRssSources();

    expect(result.totalSources).toBe(1);
    expect(result.results).toHaveLength(1);
  });

  it("should continue when one source fails", async () => {
    const source2: Source = {
      ...mockSource,
      id: "source-2",
      name: "Second Blog",
      url: "https://example2.com/feed",
    };

    vi.mocked(getSources).mockResolvedValue([mockSource, source2]);
    vi.mocked(getTags).mockResolvedValue(mockTags);

    let callCount = 0;
    mockParseURL.mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        throw new Error("Network error");
      }
      return { items: [] };
    });

    const result = await fetchAllRssSources();

    expect(result.totalSources).toBe(2);
    expect(result.results).toHaveLength(2);
  });

  it("should return empty results when no active sources", async () => {
    vi.mocked(getSources).mockResolvedValue([{ ...mockSource, is_active: false }]);
    vi.mocked(getTags).mockResolvedValue(mockTags);

    const result = await fetchAllRssSources();

    expect(result.totalSources).toBe(0);
    expect(result.results).toEqual([]);
  });
});
