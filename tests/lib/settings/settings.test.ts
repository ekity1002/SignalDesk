import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/lib/supabase.server", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { getSettings, updateSettings } from "~/lib/settings/settings.server";
import { supabase } from "~/lib/supabase.server";

const SETTINGS_ID = "00000000-0000-0000-0000-000000000001";

describe("Settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getSettings", () => {
    it("should return settings with article_retention_days", async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: {
          id: SETTINGS_ID,
          article_retention_days: 14,
          created_at: "2026-02-01T00:00:00Z",
          updated_at: "2026-02-01T00:00:00Z",
        },
        error: null,
      });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never);

      const result = await getSettings();

      expect(supabase.from).toHaveBeenCalledWith("settings");
      expect(mockSelect).toHaveBeenCalledWith("*");
      expect(mockEq).toHaveBeenCalledWith("id", SETTINGS_ID);
      expect(result.article_retention_days).toBe(14);
    });

    it("should return default settings (7 days) when no settings exist", async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: "PGRST116" },
      });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never);

      const result = await getSettings();

      expect(result.article_retention_days).toBe(7);
    });

    it("should throw error when fetch fails with unexpected error", async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: "OTHER_ERROR", message: "DB Connection Failed" },
      });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never);

      await expect(getSettings()).rejects.toThrow("Failed to fetch settings");
    });
  });

  describe("updateSettings", () => {
    it("should update article_retention_days", async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: {
          id: SETTINGS_ID,
          article_retention_days: 30,
          created_at: "2026-02-01T00:00:00Z",
          updated_at: "2026-02-07T00:00:00Z",
        },
        error: null,
      });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
      vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never);

      const result = await updateSettings(30);

      expect(supabase.from).toHaveBeenCalledWith("settings");
      expect(mockUpdate).toHaveBeenCalledWith({ article_retention_days: 30 });
      expect(mockEq).toHaveBeenCalledWith("id", SETTINGS_ID);
      expect(result.article_retention_days).toBe(30);
    });

    it("should throw error when update fails", async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Update failed" },
      });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
      vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never);

      await expect(updateSettings(30)).rejects.toThrow("Failed to update settings");
    });
  });
});
