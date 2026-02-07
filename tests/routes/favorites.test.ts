import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/lib/auth/session.server", () => ({
  getSession: vi.fn(),
}));

vi.mock("~/lib/rss/articles.server", () => ({
  getArticles: vi.fn(),
  toggleFavorite: vi.fn(),
  deleteArticle: vi.fn(),
}));

vi.mock("~/lib/prompts/prompts.server", () => ({
  getPrompts: vi.fn(() => Promise.resolve([])),
}));

import { getSession } from "~/lib/auth/session.server";
import { deleteArticle, getArticles, toggleFavorite } from "~/lib/rss/articles.server";
import { action, loader } from "~/routes/favorites";

function createRequest(url: string, method = "GET", formData?: Record<string, string>): Request {
  if (method === "POST" && formData) {
    const body = new FormData();
    for (const [key, value] of Object.entries(formData)) {
      body.append(key, value);
    }
    return new Request(url, { method, body });
  }
  return new Request(url, { method });
}

function createArgs(request: Request) {
  return { request, params: {}, context: {} } as Parameters<typeof loader>[0];
}

describe("favorites route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loader", () => {
    it("should redirect to login when not authenticated", async () => {
      vi.mocked(getSession).mockResolvedValue({
        get: () => undefined,
      } as never);

      await expect(
        loader(createArgs(createRequest("http://localhost/favorites"))),
      ).rejects.toThrow();
    });

    it("should return favorited articles when authenticated", async () => {
      vi.mocked(getSession).mockResolvedValue({
        get: (key: string) => (key === "isAuthenticated" ? true : undefined),
      } as never);

      const mockArticles = [{ id: "1", title: "Article 1", favorites: { id: "fav-1" } }];
      vi.mocked(getArticles).mockResolvedValue({
        data: mockArticles as never,
        total: 1,
      });

      const result = await loader(createArgs(createRequest("http://localhost/favorites")));

      expect(getArticles).toHaveBeenCalledWith({
        page: 1,
        limit: 50,
        status: "visible",
        favoritesOnly: true,
        search: undefined,
      });
      expect(result.articles).toEqual(mockArticles);
      expect(result.total).toBe(1);
    });

    it("should pass search parameter to getArticles", async () => {
      vi.mocked(getSession).mockResolvedValue({
        get: (key: string) => (key === "isAuthenticated" ? true : undefined),
      } as never);

      vi.mocked(getArticles).mockResolvedValue({
        data: [],
        total: 0,
      });

      await loader(createArgs(createRequest("http://localhost/favorites?search=test")));

      expect(getArticles).toHaveBeenCalledWith(expect.objectContaining({ search: "test" }));
    });

    it("should handle pagination", async () => {
      vi.mocked(getSession).mockResolvedValue({
        get: (key: string) => (key === "isAuthenticated" ? true : undefined),
      } as never);

      vi.mocked(getArticles).mockResolvedValue({
        data: [],
        total: 100,
      });

      const result = await loader(createArgs(createRequest("http://localhost/favorites?page=2")));

      expect(getArticles).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }));
      expect(result.page).toBe(2);
      expect(result.totalPages).toBe(2);
    });
  });

  describe("action", () => {
    it("should redirect to login when not authenticated", async () => {
      vi.mocked(getSession).mockResolvedValue({
        get: () => undefined,
      } as never);

      const request = createRequest("http://localhost/favorites", "POST", {
        intent: "favorite",
        articleId: "1",
      });

      await expect(action(createArgs(request) as Parameters<typeof action>[0])).rejects.toThrow();
    });

    it("should toggle favorite when intent is favorite", async () => {
      vi.mocked(getSession).mockResolvedValue({
        get: (key: string) => (key === "isAuthenticated" ? true : undefined),
      } as never);

      vi.mocked(toggleFavorite).mockResolvedValue({ favorited: false });

      const request = createRequest("http://localhost/favorites", "POST", {
        intent: "favorite",
        articleId: "article-1",
      });

      const result = await action(createArgs(request) as Parameters<typeof action>[0]);

      expect(toggleFavorite).toHaveBeenCalledWith("article-1");
      expect(result).toEqual({ success: true });
    });

    it("should delete article when intent is delete", async () => {
      vi.mocked(getSession).mockResolvedValue({
        get: (key: string) => (key === "isAuthenticated" ? true : undefined),
      } as never);

      vi.mocked(deleteArticle).mockResolvedValue();

      const request = createRequest("http://localhost/favorites", "POST", {
        intent: "delete",
        articleId: "article-1",
      });

      const result = await action(createArgs(request) as Parameters<typeof action>[0]);

      expect(deleteArticle).toHaveBeenCalledWith("article-1");
      expect(result).toEqual({ success: true });
    });

    it("should return error when articleId is invalid", async () => {
      vi.mocked(getSession).mockResolvedValue({
        get: (key: string) => (key === "isAuthenticated" ? true : undefined),
      } as never);

      const request = createRequest("http://localhost/favorites", "POST", {
        intent: "favorite",
      });

      const result = await action(createArgs(request) as Parameters<typeof action>[0]);

      expect(result).toEqual({ success: false, error: "Invalid article ID" });
    });
  });
});
