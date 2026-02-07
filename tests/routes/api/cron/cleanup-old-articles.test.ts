import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/lib/settings/settings.server", () => ({
  getSettings: vi.fn(),
}));

vi.mock("~/lib/rss/articles.server", () => ({
  deleteOldArticles: vi.fn(),
}));

import { deleteOldArticles } from "~/lib/rss/articles.server";
import { getSettings } from "~/lib/settings/settings.server";
import { loader } from "~/routes/api/cron/cleanup-old-articles";

describe("GET /api/cron/cleanup-old-articles", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, CRON_SECRET: "test-secret" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should return 401 when no authorization header", async () => {
    const request = new Request("http://localhost/api/cron/cleanup-old-articles");
    const response = await loader({ request, params: {}, context: {} } as never);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("should return 401 when authorization token is invalid", async () => {
    const request = new Request("http://localhost/api/cron/cleanup-old-articles", {
      headers: { Authorization: "Bearer wrong-secret" },
    });
    const response = await loader({ request, params: {}, context: {} } as never);

    expect(response.status).toBe(401);
  });

  it("should return 401 when CRON_SECRET is not configured", async () => {
    const { CRON_SECRET: _, ...envWithoutCron } = originalEnv;
    process.env = envWithoutCron;

    const request = new Request("http://localhost/api/cron/cleanup-old-articles", {
      headers: { Authorization: "Bearer some-token" },
    });
    const response = await loader({ request, params: {}, context: {} } as never);

    expect(response.status).toBe(401);
  });

  it("should execute cleanup and return results on valid auth", async () => {
    vi.mocked(getSettings).mockResolvedValue({
      id: "00000000-0000-0000-0000-000000000001",
      article_retention_days: 7,
      created_at: "2026-02-01T00:00:00Z",
      updated_at: "2026-02-01T00:00:00Z",
    });
    vi.mocked(deleteOldArticles).mockResolvedValue({ deletedCount: 15 });

    const request = new Request("http://localhost/api/cron/cleanup-old-articles", {
      headers: { Authorization: "Bearer test-secret" },
    });
    const response = await loader({ request, params: {}, context: {} } as never);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.deletedCount).toBe(15);
    expect(body.retentionDays).toBe(7);

    expect(getSettings).toHaveBeenCalled();
    expect(deleteOldArticles).toHaveBeenCalledWith(7);
  });

  it("should return 500 when getSettings fails", async () => {
    vi.mocked(getSettings).mockRejectedValue(new Error("DB connection failed"));

    const request = new Request("http://localhost/api/cron/cleanup-old-articles", {
      headers: { Authorization: "Bearer test-secret" },
    });
    const response = await loader({ request, params: {}, context: {} } as never);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe("DB connection failed");
  });

  it("should return 500 when deleteOldArticles fails", async () => {
    vi.mocked(getSettings).mockResolvedValue({
      id: "00000000-0000-0000-0000-000000000001",
      article_retention_days: 7,
      created_at: "2026-02-01T00:00:00Z",
      updated_at: "2026-02-01T00:00:00Z",
    });
    vi.mocked(deleteOldArticles).mockRejectedValue(new Error("Delete operation failed"));

    const request = new Request("http://localhost/api/cron/cleanup-old-articles", {
      headers: { Authorization: "Bearer test-secret" },
    });
    const response = await loader({ request, params: {}, context: {} } as never);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.success).toBe(false);
  });
});
