import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createPrompt,
  deletePrompt,
  getPromptById,
  getPrompts,
  type Prompt,
  updatePrompt,
} from "~/lib/prompts/prompts.server";
import type { CreatePromptInput, UpdatePromptInput } from "~/lib/prompts/schemas";

// Mock supabase
vi.mock("~/lib/supabase.server", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from "~/lib/supabase.server";

describe("Prompts Server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPrompts", () => {
    it("should return all prompts ordered by created_at desc", async () => {
      const mockPrompts: Prompt[] = [
        {
          id: "1",
          name: "Tech Summary",
          template: "Summarize: {{title}}",
          is_default: true,
          created_at: "2026-02-07T00:00:00Z",
          updated_at: "2026-02-07T00:00:00Z",
        },
        {
          id: "2",
          name: "Quick Share",
          template: "Check out: {{title}} - {{link}}",
          is_default: false,
          created_at: "2026-02-06T00:00:00Z",
          updated_at: "2026-02-06T00:00:00Z",
        },
      ];

      const mockSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: mockPrompts, error: null }),
      });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never);

      const result = await getPrompts();

      expect(supabase.from).toHaveBeenCalledWith("prompts");
      expect(result).toEqual(mockPrompts);
    });

    it("should throw error when fetch fails", async () => {
      const mockSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: null, error: { message: "DB Error" } }),
      });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never);

      await expect(getPrompts()).rejects.toThrow("Failed to fetch prompts");
    });
  });

  describe("getPromptById", () => {
    it("should return a prompt by id", async () => {
      const mockPrompt: Prompt = {
        id: "1",
        name: "Tech Summary",
        template: "Summarize: {{title}}",
        is_default: true,
        created_at: "2026-02-07T00:00:00Z",
        updated_at: "2026-02-07T00:00:00Z",
      };

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockPrompt, error: null }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never);

      const result = await getPromptById("1");

      expect(supabase.from).toHaveBeenCalledWith("prompts");
      expect(result).toEqual(mockPrompt);
    });

    it("should return null when prompt not found", async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never);

      const result = await getPromptById("nonexistent");

      expect(result).toBeNull();
    });

    it("should throw error when fetch fails", async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: "DB Error" } }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never);

      await expect(getPromptById("1")).rejects.toThrow("Failed to fetch prompt");
    });
  });

  describe("createPrompt", () => {
    it("should create a new prompt", async () => {
      const input: CreatePromptInput = {
        name: "Tech Summary",
        template: "Summarize: {{title}}",
        is_default: false,
      };

      const mockPrompt: Prompt = {
        id: "1",
        name: input.name,
        template: input.template,
        is_default: input.is_default,
        created_at: "2026-02-07T00:00:00Z",
        updated_at: "2026-02-07T00:00:00Z",
      };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockPrompt, error: null }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never);

      const result = await createPrompt(input);

      expect(supabase.from).toHaveBeenCalledWith("prompts");
      expect(result).toEqual(mockPrompt);
    });

    it("should create a prompt with is_default=true and unset other defaults", async () => {
      const input: CreatePromptInput = {
        name: "New Default",
        template: "Template: {{title}}",
        is_default: true,
      };

      const mockPrompt: Prompt = {
        id: "2",
        name: input.name,
        template: input.template,
        is_default: true,
        created_at: "2026-02-07T00:00:00Z",
        updated_at: "2026-02-07T00:00:00Z",
      };

      // Mock for unsetting other defaults
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      // Mock for insert
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockPrompt, error: null }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
        insert: mockInsert,
      } as never);

      const result = await createPrompt(input);

      expect(mockUpdate).toHaveBeenCalledWith({ is_default: false });
      expect(result).toEqual(mockPrompt);
    });

    it("should throw error when creation fails", async () => {
      const input: CreatePromptInput = {
        name: "Test",
        template: "Template",
        is_default: false,
      };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "DB Error" },
          }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never);

      await expect(createPrompt(input)).rejects.toThrow("Failed to create prompt");
    });
  });

  describe("updatePrompt", () => {
    it("should update a prompt", async () => {
      const input: UpdatePromptInput = {
        name: "Updated Name",
        template: "Updated: {{title}}",
      };

      const mockPrompt: Prompt = {
        id: "1",
        name: input.name!,
        template: input.template!,
        is_default: false,
        created_at: "2026-02-07T00:00:00Z",
        updated_at: "2026-02-07T01:00:00Z",
      };

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockPrompt, error: null }),
          }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never);

      const result = await updatePrompt("1", input);

      expect(supabase.from).toHaveBeenCalledWith("prompts");
      expect(result).toEqual(mockPrompt);
    });

    it("should unset other defaults when setting is_default=true", async () => {
      const input: UpdatePromptInput = {
        is_default: true,
      };

      const mockPrompt: Prompt = {
        id: "1",
        name: "Test",
        template: "Template",
        is_default: true,
        created_at: "2026-02-07T00:00:00Z",
        updated_at: "2026-02-07T01:00:00Z",
      };

      // Track calls
      let updateCallCount = 0;
      const mockUpdate = vi.fn().mockImplementation(() => {
        updateCallCount++;
        if (updateCallCount === 1) {
          // First call: unset other defaults
          return {
            eq: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        // Second call: update this prompt
        return {
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockPrompt, error: null }),
            }),
          }),
        };
      });

      vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never);

      const result = await updatePrompt("1", input);

      expect(mockUpdate).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockPrompt);
    });

    it("should throw error when update fails", async () => {
      const input: UpdatePromptInput = {
        name: "Updated",
      };

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "DB Error" },
            }),
          }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never);

      await expect(updatePrompt("1", input)).rejects.toThrow("Failed to update prompt");
    });

    it("should throw error when prompt not found", async () => {
      const input: UpdatePromptInput = {
        name: "Updated",
      };

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: "PGRST116" },
            }),
          }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never);

      await expect(updatePrompt("1", input)).rejects.toThrow("Prompt not found");
    });
  });

  describe("deletePrompt", () => {
    it("should delete a prompt by id", async () => {
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as never);

      await deletePrompt("1");

      expect(supabase.from).toHaveBeenCalledWith("prompts");
    });

    it("should throw error when delete fails", async () => {
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: { message: "Delete failed" } }),
      });
      vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as never);

      await expect(deletePrompt("1")).rejects.toThrow("Failed to delete prompt");
    });
  });
});
