import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  type CreateTagInput,
  createTag,
  deleteTag,
  getTags,
  type Tag,
  updateTagKeywords,
} from "~/lib/tags/tags.server";

// Mock supabase
vi.mock("~/lib/supabase.server", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from "~/lib/supabase.server";

describe("Tags Server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getTags", () => {
    it("should return all tags with keywords ordered by created_at desc", async () => {
      const mockTags: Tag[] = [
        {
          id: "1",
          name: "AI",
          created_at: "2026-02-04T00:00:00Z",
          keywords: [
            { id: "k1", tag_id: "1", keyword: "machine learning" },
            { id: "k2", tag_id: "1", keyword: "deep learning" },
          ],
        },
        {
          id: "2",
          name: "Cloud",
          created_at: "2026-02-03T00:00:00Z",
          keywords: [{ id: "k3", tag_id: "2", keyword: "AWS" }],
        },
      ];

      const mockSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: mockTags, error: null }),
      });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never);

      const result = await getTags();

      expect(supabase.from).toHaveBeenCalledWith("tags");
      expect(result).toEqual(mockTags);
    });

    it("should throw error when fetch fails", async () => {
      const mockSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: null, error: { message: "DB Error" } }),
      });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never);

      await expect(getTags()).rejects.toThrow("Failed to fetch tags");
    });
  });

  describe("createTag", () => {
    it("should create a new tag with keywords", async () => {
      const input: CreateTagInput = {
        name: "AI",
        keywords: ["machine learning", "deep learning"],
      };

      const mockTag = {
        id: "1",
        name: "AI",
        created_at: "2026-02-04T00:00:00Z",
      };

      const mockKeywords = [
        { id: "k1", tag_id: "1", keyword: "machine learning" },
        { id: "k2", tag_id: "1", keyword: "deep learning" },
      ];

      // Mock for tag insert
      const mockTagInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockTag, error: null }),
        }),
      });

      // Mock for keywords insert
      const mockKeywordsInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: mockKeywords, error: null }),
      });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "tags") {
          return { insert: mockTagInsert } as never;
        }
        if (table === "tag_keywords") {
          return { insert: mockKeywordsInsert } as never;
        }
        return {} as never;
      });

      const result = await createTag(input);

      expect(supabase.from).toHaveBeenCalledWith("tags");
      expect(supabase.from).toHaveBeenCalledWith("tag_keywords");
      expect(result).toEqual({ ...mockTag, keywords: mockKeywords });
    });

    it("should create a tag without keywords", async () => {
      const input: CreateTagInput = {
        name: "AI",
        keywords: [],
      };

      const mockTag = {
        id: "1",
        name: "AI",
        created_at: "2026-02-04T00:00:00Z",
      };

      const mockTagInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockTag, error: null }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({ insert: mockTagInsert } as never);

      const result = await createTag(input);

      expect(result).toEqual({ ...mockTag, keywords: [] });
    });

    it("should throw error when tag name already exists (23505)", async () => {
      const input: CreateTagInput = {
        name: "AI",
        keywords: [],
      };

      const mockTagInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: "23505", message: "duplicate key" },
          }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({ insert: mockTagInsert } as never);

      await expect(createTag(input)).rejects.toThrow("A tag with this name already exists");
    });

    it("should rollback tag when keyword insert fails", async () => {
      const input: CreateTagInput = {
        name: "AI",
        keywords: ["machine learning"],
      };

      const mockTag = {
        id: "1",
        name: "AI",
        created_at: "2026-02-04T00:00:00Z",
      };

      // Mock for tag insert (success)
      const mockTagInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockTag, error: null }),
        }),
      });

      // Mock for keywords insert (failure)
      const mockKeywordsInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Insert error" },
        }),
      });

      // Mock for tag delete (rollback)
      const mockTagDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "tags") {
          return { insert: mockTagInsert, delete: mockTagDelete } as never;
        }
        if (table === "tag_keywords") {
          return { insert: mockKeywordsInsert } as never;
        }
        return {} as never;
      });

      await expect(createTag(input)).rejects.toThrow("Failed to create keywords");
      expect(mockTagDelete).toHaveBeenCalled();
    });

    it("should throw error when tag creation fails", async () => {
      const input: CreateTagInput = {
        name: "AI",
        keywords: [],
      };

      const mockTagInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: "500", message: "DB Error" },
          }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({ insert: mockTagInsert } as never);

      await expect(createTag(input)).rejects.toThrow("Failed to create tag");
    });
  });

  describe("deleteTag", () => {
    it("should delete a tag by id (keywords cascade)", async () => {
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as never);

      await deleteTag("1");

      expect(supabase.from).toHaveBeenCalledWith("tags");
    });

    it("should throw error when delete fails", async () => {
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: { message: "Not found" } }),
      });
      vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as never);

      await expect(deleteTag("1")).rejects.toThrow("Failed to delete tag");
    });
  });

  describe("updateTagKeywords", () => {
    it("should update keywords for a tag", async () => {
      const tagId = "1";
      const keywords = ["new keyword 1", "new keyword 2"];

      const mockKeywords = [
        { id: "k1", tag_id: "1", keyword: "new keyword 1" },
        { id: "k2", tag_id: "1", keyword: "new keyword 2" },
      ];

      // Mock for select (fetch old keywords)
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      });

      // Mock for delete existing keywords
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      // Mock for insert new keywords
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: mockKeywords, error: null }),
      });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "tag_keywords") {
          return {
            select: mockSelect,
            delete: mockDelete,
            insert: mockInsert,
          } as never;
        }
        return {} as never;
      });

      const result = await updateTagKeywords(tagId, keywords);

      expect(supabase.from).toHaveBeenCalledWith("tag_keywords");
      expect(result).toEqual(mockKeywords);
    });

    it("should handle empty keywords array", async () => {
      const tagId = "1";
      const keywords: string[] = [];

      // Mock for select (fetch old keywords)
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      });

      // Mock for delete existing keywords
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        delete: mockDelete,
      } as never);

      const result = await updateTagKeywords(tagId, keywords);

      expect(supabase.from).toHaveBeenCalledWith("tag_keywords");
      expect(result).toEqual([]);
    });

    it("should throw error when delete fails", async () => {
      // Mock for select (fetch old keywords)
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      });

      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: { message: "Delete error" } }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        delete: mockDelete,
      } as never);

      await expect(updateTagKeywords("1", ["test"])).rejects.toThrow("Failed to update keywords");
    });

    it("should restore old keywords when insert fails", async () => {
      const oldKeywords = [
        { id: "k1", tag_id: "1", keyword: "old keyword 1" },
        { id: "k2", tag_id: "1", keyword: "old keyword 2" },
      ];

      // Mock for select (fetch old keywords)
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: oldKeywords, error: null }),
      });

      // Mock for delete existing keywords
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      // Track insert calls to distinguish between new keywords (fail) and restore (succeed)
      let insertCallCount = 0;
      const mockInsert = vi.fn().mockImplementation(() => {
        insertCallCount++;
        if (insertCallCount === 1) {
          // First call: new keywords insert fails
          return {
            select: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "Insert error" },
            }),
          };
        }
        // Second call: restore old keywords succeeds
        return {
          select: vi.fn().mockResolvedValue({ data: oldKeywords, error: null }),
        };
      });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "tag_keywords") {
          return {
            select: mockSelect,
            delete: mockDelete,
            insert: mockInsert,
          } as never;
        }
        return {} as never;
      });

      await expect(updateTagKeywords("1", ["test"])).rejects.toThrow("Failed to update keywords");
      // insert called twice: first for new keywords (fail), second for restore
      expect(mockInsert).toHaveBeenCalledTimes(2);
    });
  });
});
