import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("~/lib/auth/session.server", () => ({
  getSession: vi.fn(),
}));

vi.mock("~/lib/rss/articles.server", () => ({
  getArticles: vi.fn(),
  toggleFavorite: vi.fn(),
  restoreArticle: vi.fn(),
}));

import { getSession } from "~/lib/auth/session.server";
import { getArticles, toggleFavorite, restoreArticle } from "~/lib/rss/articles.server";
import { loader, action } from "~/routes/excluded";

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

describe("excluded route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loader", () => {
    it("should redirect to login when not authenticated", async () => {
      vi.mocked(getSession).mockResolvedValue({
        get: () => undefined,
      } as never);

      await expect(loader(createArgs(createRequest("http://localhost/excluded")))).rejects.toThrow();
    });

    it("should return excluded articles when authenticated", async () => {
      vi.mocked(getSession).mockResolvedValue({
        get: (key: string) => (key === "isAuthenticated" ? true : undefined),
      } as never);

      const mockArticles = [
        { id: "1", title: "Excluded Article 1", status: "excluded" },
      ];
      vi.mocked(getArticles).mockResolvedValue({
        data: mockArticles as never,
        total: 1,
      });

      const result = await loader(createArgs(createRequest("http://localhost/excluded")));

      expect(getArticles).toHaveBeenCalledWith({
        page: 1,
        limit: 50,
        status: "excluded",
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

      await loader(createArgs(createRequest("http://localhost/excluded?search=test")));

      expect(getArticles).toHaveBeenCalledWith(
        expect.objectContaining({ search: "test" }),
      );
    });

    it("should handle pagination", async () => {
      vi.mocked(getSession).mockResolvedValue({
        get: (key: string) => (key === "isAuthenticated" ? true : undefined),
      } as never);

      vi.mocked(getArticles).mockResolvedValue({
        data: [],
        total: 100,
      });

      const result = await loader(createArgs(createRequest("http://localhost/excluded?page=2")));

      expect(getArticles).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 }),
      );
      expect(result.page).toBe(2);
      expect(result.totalPages).toBe(2);
    });
  });

  describe("action", () => {
    it("should redirect to login when not authenticated", async () => {
      vi.mocked(getSession).mockResolvedValue({
        get: () => undefined,
      } as never);

      const request = createRequest("http://localhost/excluded", "POST", {
        intent: "restore",
        articleId: "1",
      });

      await expect(action(createArgs(request) as Parameters<typeof action>[0])).rejects.toThrow();
    });

    it("should toggle favorite when intent is favorite", async () => {
      vi.mocked(getSession).mockResolvedValue({
        get: (key: string) => (key === "isAuthenticated" ? true : undefined),
      } as never);

      vi.mocked(toggleFavorite).mockResolvedValue({ favorited: true });

      const request = createRequest("http://localhost/excluded", "POST", {
        intent: "favorite",
        articleId: "article-1",
      });

      const result = await action(createArgs(request) as Parameters<typeof action>[0]);

      expect(toggleFavorite).toHaveBeenCalledWith("article-1");
      expect(result).toEqual({ success: true });
    });

    it("should restore article when intent is restore", async () => {
      vi.mocked(getSession).mockResolvedValue({
        get: (key: string) => (key === "isAuthenticated" ? true : undefined),
      } as never);

      vi.mocked(restoreArticle).mockResolvedValue({} as never);

      const request = createRequest("http://localhost/excluded", "POST", {
        intent: "restore",
        articleId: "article-1",
      });

      const result = await action(createArgs(request) as Parameters<typeof action>[0]);

      expect(restoreArticle).toHaveBeenCalledWith("article-1");
      expect(result).toEqual({ success: true });
    });

    it("should return error when articleId is invalid for favorite", async () => {
      vi.mocked(getSession).mockResolvedValue({
        get: (key: string) => (key === "isAuthenticated" ? true : undefined),
      } as never);

      const request = createRequest("http://localhost/excluded", "POST", {
        intent: "favorite",
      });

      const result = await action(createArgs(request) as Parameters<typeof action>[0]);

      expect(result).toEqual({ success: false, error: "Invalid article ID" });
    });

    it("should return error when articleId is invalid for restore", async () => {
      vi.mocked(getSession).mockResolvedValue({
        get: (key: string) => (key === "isAuthenticated" ? true : undefined),
      } as never);

      const request = createRequest("http://localhost/excluded", "POST", {
        intent: "restore",
      });

      const result = await action(createArgs(request) as Parameters<typeof action>[0]);

      expect(result).toEqual({ success: false, error: "Invalid article ID" });
    });

    it("should handle restore error gracefully", async () => {
      vi.mocked(getSession).mockResolvedValue({
        get: (key: string) => (key === "isAuthenticated" ? true : undefined),
      } as never);

      vi.mocked(restoreArticle).mockRejectedValue(new Error("Database error"));

      const request = createRequest("http://localhost/excluded", "POST", {
        intent: "restore",
        articleId: "article-1",
      });

      const result = await action(createArgs(request) as Parameters<typeof action>[0]);

      expect(result).toEqual({ success: false, error: "Database error" });
    });
  });
});
