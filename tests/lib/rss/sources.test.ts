import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  type CreateSourceInput,
  createSource,
  deleteSource,
  getMaxSources,
  getSources,
  type Source,
  toggleSourceActive,
} from "~/lib/rss/sources.server";

// Mock supabase
vi.mock("~/lib/supabase.server", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from "~/lib/supabase.server";

describe("getMaxSources", () => {
  const originalEnv = process.env.MAX_RSS_SOURCES;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.MAX_RSS_SOURCES;
    } else {
      process.env.MAX_RSS_SOURCES = originalEnv;
    }
  });

  it("should return default value 10 when MAX_RSS_SOURCES is not set", () => {
    delete process.env.MAX_RSS_SOURCES;
    expect(getMaxSources()).toBe(10);
  });

  it("should return the value from MAX_RSS_SOURCES when set", () => {
    process.env.MAX_RSS_SOURCES = "20";
    expect(getMaxSources()).toBe(20);
  });

  it("should return default value 10 when MAX_RSS_SOURCES is empty string", () => {
    process.env.MAX_RSS_SOURCES = "";
    expect(getMaxSources()).toBe(10);
  });

  it("should return default value 10 when MAX_RSS_SOURCES is not a valid number", () => {
    process.env.MAX_RSS_SOURCES = "abc";
    expect(getMaxSources()).toBe(10);
  });

  it("should return default value 10 when MAX_RSS_SOURCES is negative", () => {
    process.env.MAX_RSS_SOURCES = "-5";
    expect(getMaxSources()).toBe(10);
  });

  it("should return default value 10 when MAX_RSS_SOURCES is zero", () => {
    process.env.MAX_RSS_SOURCES = "0";
    expect(getMaxSources()).toBe(10);
  });

  it("should return default value 10 when MAX_RSS_SOURCES is a decimal", () => {
    process.env.MAX_RSS_SOURCES = "5.5";
    expect(getMaxSources()).toBe(10);
  });
});

describe("RSS Sources", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.MAX_RSS_SOURCES;
  });

  describe("getSources", () => {
    it("should return all sources ordered by created_at desc", async () => {
      const mockSources: Source[] = [
        {
          id: "1",
          name: "TechCrunch",
          url: "https://techcrunch.com/feed/",
          is_active: true,
          created_at: "2026-02-04T00:00:00Z",
        },
        {
          id: "2",
          name: "AWS Blog",
          url: "https://aws.amazon.com/blogs/news/feed/",
          is_active: true,
          created_at: "2026-02-03T00:00:00Z",
        },
      ];

      const mockSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: mockSources, error: null }),
      });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never);

      const result = await getSources();

      expect(supabase.from).toHaveBeenCalledWith("sources");
      expect(result).toEqual(mockSources);
    });

    it("should throw error when fetch fails", async () => {
      const mockSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: null, error: { message: "DB Error" } }),
      });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never);

      await expect(getSources()).rejects.toThrow("Failed to fetch sources");
    });
  });

  describe("createSource", () => {
    it("should create a new source", async () => {
      const input: CreateSourceInput = {
        name: "TechCrunch",
        url: "https://techcrunch.com/feed/",
      };

      const mockSource: Source = {
        id: "1",
        ...input,
        is_active: true,
        created_at: "2026-02-04T00:00:00Z",
      };

      // Mock for getSources (count check) - returns empty array
      const mockSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      });
      // Mock for insert
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockSource, error: null }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "sources") {
          return {
            select: mockSelect,
            insert: mockInsert,
          } as never;
        }
        return {} as never;
      });

      const result = await createSource(input);

      expect(supabase.from).toHaveBeenCalledWith("sources");
      expect(result).toEqual(mockSource);
    });

    it("should throw error for invalid URL", async () => {
      const input: CreateSourceInput = {
        name: "Test",
        url: "not-a-valid-url",
      };

      await expect(createSource(input)).rejects.toThrow("Invalid URL format");
    });

    it("should throw error when source limit reached", async () => {
      // Mock count check
      const mockSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: Array(10).fill({ id: "x" }),
          error: null,
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never);

      const input: CreateSourceInput = {
        name: "Test",
        url: "https://example.com/feed",
      };

      await expect(createSource(input)).rejects.toThrow("Maximum sources limit (10) reached");
    });

    it("should use custom limit from MAX_RSS_SOURCES environment variable", async () => {
      process.env.MAX_RSS_SOURCES = "5";

      // Mock count check - 5 sources already exist
      const mockSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: Array(5).fill({ id: "x" }),
          error: null,
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never);

      const input: CreateSourceInput = {
        name: "Test",
        url: "https://example.com/feed",
      };

      await expect(createSource(input)).rejects.toThrow("Maximum sources limit (5) reached");
    });

    it("should throw error when URL already exists", async () => {
      const input: CreateSourceInput = {
        name: "TechCrunch",
        url: "https://techcrunch.com/feed/",
      };

      // Mock for getSources (count check) - returns empty array
      const mockSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      });
      // Mock for insert - returns unique constraint violation error
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: "23505", message: "duplicate key value violates unique constraint" },
          }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "sources") {
          return {
            select: mockSelect,
            insert: mockInsert,
          } as never;
        }
        return {} as never;
      });

      await expect(createSource(input)).rejects.toThrow("A source with this URL already exists");
    });
  });

  describe("deleteSource", () => {
    it("should delete a source by id", async () => {
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as never);

      await deleteSource("1");

      expect(supabase.from).toHaveBeenCalledWith("sources");
    });

    it("should throw error when delete fails", async () => {
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: { message: "Not found" } }),
      });
      vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as never);

      await expect(deleteSource("1")).rejects.toThrow("Failed to delete source");
    });
  });

  describe("toggleSourceActive", () => {
    it("should toggle source active status", async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: "1", is_active: false },
              error: null,
            }),
          }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never);

      const result = await toggleSourceActive("1", false);

      expect(result.is_active).toBe(false);
    });
  });
});
