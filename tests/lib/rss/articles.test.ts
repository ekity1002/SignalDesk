import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  type Article,
  articleExistsByCanonicalUrl,
  attachTagsToArticle,
  createArticle,
  deleteArticle,
  getArticles,
  toggleFavorite,
  updateArticleStatus,
} from "~/lib/rss/articles.server";

vi.mock("~/lib/supabase.server", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from "~/lib/supabase.server";

const mockArticle: Article = {
  id: "article-1",
  title: "Test Article",
  description: "Test description",
  link: "https://example.com/article",
  canonical_url: "https://example.com/article",
  published_at: "2026-02-01T00:00:00Z",
  source_id: "source-1",
  status: "visible",
  created_at: "2026-02-01T00:00:00Z",
  updated_at: "2026-02-01T00:00:00Z",
};

describe("Articles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getArticles", () => {
    it("should return articles with pagination", async () => {
      const mockRange = vi.fn().mockResolvedValue({
        data: [mockArticle],
        error: null,
        count: 1,
      });
      const mockOrder = vi.fn().mockReturnValue({ range: mockRange });
      const mockEqStatus = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEqStatus });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never);

      const result = await getArticles({ page: 1, limit: 50, status: "visible" });

      expect(supabase.from).toHaveBeenCalledWith("articles");
      expect(result.data).toEqual([mockArticle]);
      expect(result.total).toBe(1);
    });

    it("should throw error when fetch fails", async () => {
      const mockRange = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "DB Error" },
        count: null,
      });
      const mockOrder = vi.fn().mockReturnValue({ range: mockRange });
      const mockEqStatus = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEqStatus });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never);

      await expect(getArticles({ page: 1, limit: 50, status: "visible" })).rejects.toThrow(
        "Failed to fetch articles",
      );
    });
  });

  describe("articleExistsByCanonicalUrl", () => {
    it("should return true when article exists", async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: { id: "1" },
        error: null,
      });
      const mockMaybeSingle = vi.fn().mockReturnValue(mockSingle());
      const mockLimit = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockEq = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never);

      const result = await articleExistsByCanonicalUrl("https://example.com/article");
      expect(result).toBe(true);
    });

    it("should return false when article does not exist", async () => {
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });
      const mockLimit = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockEq = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never);

      const result = await articleExistsByCanonicalUrl("https://example.com/nonexistent");
      expect(result).toBe(false);
    });

    it("should throw error when query fails", async () => {
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "DB Error" },
      });
      const mockLimit = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockEq = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never);

      await expect(
        articleExistsByCanonicalUrl("https://example.com/article"),
      ).rejects.toThrow("Failed to check article existence");
    });
  });

  describe("createArticle", () => {
    it("should create a new article", async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockArticle,
        error: null,
      });
      const mockSelectAfterInsert = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelectAfterInsert });
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never);

      const result = await createArticle({
        title: "Test Article",
        description: "Test description",
        link: "https://example.com/article",
        canonical_url: "https://example.com/article",
        published_at: "2026-02-01T00:00:00Z",
        source_id: "source-1",
        status: "visible",
      });

      expect(supabase.from).toHaveBeenCalledWith("articles");
      expect(result).toEqual(mockArticle);
    });

    it("should throw error when creation fails", async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "DB Error" },
      });
      const mockSelectAfterInsert = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelectAfterInsert });
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never);

      await expect(
        createArticle({
          title: "Test",
          link: "https://example.com",
          canonical_url: "https://example.com",
          source_id: "source-1",
          status: "visible",
        }),
      ).rejects.toThrow("Failed to create article");
    });
  });

  describe("attachTagsToArticle", () => {
    it("should attach tags to an article", async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never);

      await attachTagsToArticle("article-1", ["tag-1", "tag-2"]);

      expect(supabase.from).toHaveBeenCalledWith("article_tags");
      expect(mockInsert).toHaveBeenCalledWith([
        { article_id: "article-1", tag_id: "tag-1" },
        { article_id: "article-1", tag_id: "tag-2" },
      ]);
    });

    it("should do nothing when tagIds is empty", async () => {
      await attachTagsToArticle("article-1", []);
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it("should throw error when attach fails", async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: { message: "DB Error" } });
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never);

      await expect(attachTagsToArticle("article-1", ["tag-1"])).rejects.toThrow(
        "Failed to attach tags to article",
      );
    });
  });

  describe("updateArticleStatus", () => {
    it("should update article status", async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: { ...mockArticle, status: "excluded" },
        error: null,
      });
      const mockSelectAfterUpdate = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ select: mockSelectAfterUpdate });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
      vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never);

      const result = await updateArticleStatus("article-1", "excluded");

      expect(supabase.from).toHaveBeenCalledWith("articles");
      expect(result.status).toBe("excluded");
    });

    it("should throw error when update fails", async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "DB Error" },
      });
      const mockSelectAfterUpdate = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ select: mockSelectAfterUpdate });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
      vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never);

      await expect(updateArticleStatus("article-1", "excluded")).rejects.toThrow(
        "Failed to update article status",
      );
    });
  });

  describe("deleteArticle", () => {
    it("should delete an article by id", async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });
      vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as never);

      await deleteArticle("article-1");

      expect(supabase.from).toHaveBeenCalledWith("articles");
    });

    it("should throw error when delete fails", async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: { message: "DB Error" } });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });
      vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as never);

      await expect(deleteArticle("article-1")).rejects.toThrow("Failed to delete article");
    });
  });

  describe("toggleFavorite", () => {
    it("should add favorite when not already favorited", async () => {
      // First call: check if favorite exists (returns null)
      const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      // Second call: insert favorite
      const mockInsertSingle = vi.fn().mockResolvedValue({
        data: { id: "fav-1", article_id: "article-1" },
        error: null,
      });
      const mockInsertSelect = vi.fn().mockReturnValue({ single: mockInsertSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockInsertSelect });

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return { select: mockSelect } as never;
        }
        return { insert: mockInsert } as never;
      });

      const result = await toggleFavorite("article-1");
      expect(result.favorited).toBe(true);
    });

    it("should remove favorite when already favorited", async () => {
      // First call: check if favorite exists (returns a favorite)
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: { id: "fav-1", article_id: "article-1" },
        error: null,
      });
      const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      // Second call: delete favorite
      const mockDeleteEq = vi.fn().mockResolvedValue({ error: null });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockDeleteEq });

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return { select: mockSelect } as never;
        }
        return { delete: mockDelete } as never;
      });

      const result = await toggleFavorite("article-1");
      expect(result.favorited).toBe(false);
    });

    it("should throw error when favorite status check fails", async () => {
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "DB Error" },
      });
      const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never);

      await expect(toggleFavorite("article-1")).rejects.toThrow(
        "Failed to check favorite status",
      );
    });
  });
});
