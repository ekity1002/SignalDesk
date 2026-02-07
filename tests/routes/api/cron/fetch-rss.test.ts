import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/lib/rss/fetch-rss.server", () => ({
  fetchAllRssSources: vi.fn(),
}));

import { fetchAllRssSources } from "~/lib/rss/fetch-rss.server";
import { loader } from "~/routes/api/cron/fetch-rss";

describe("GET /api/cron/fetch-rss", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, CRON_SECRET: "test-secret" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should return 401 when no authorization header", async () => {
    const request = new Request("http://localhost/api/cron/fetch-rss");
    const response = await loader({ request, params: {}, context: {} } as never);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("should return 401 when authorization token is invalid", async () => {
    const request = new Request("http://localhost/api/cron/fetch-rss", {
      headers: { Authorization: "Bearer wrong-secret" },
    });
    const response = await loader({ request, params: {}, context: {} } as never);

    expect(response.status).toBe(401);
  });

  it("should execute fetch and return results on valid auth", async () => {
    vi.mocked(fetchAllRssSources).mockResolvedValue({
      totalSources: 2,
      results: [
        { sourceId: "1", sourceName: "Blog", created: 5, skipped: 2, errors: [] },
        { sourceId: "2", sourceName: "News", created: 3, skipped: 1, errors: [] },
      ],
    });

    const request = new Request("http://localhost/api/cron/fetch-rss", {
      headers: { Authorization: "Bearer test-secret" },
    });
    const response = await loader({ request, params: {}, context: {} } as never);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.totalSources).toBe(2);
    expect(body.results).toHaveLength(2);
  });

  it("should return 500 when fetch fails", async () => {
    vi.mocked(fetchAllRssSources).mockRejectedValue(new Error("DB connection failed"));

    const request = new Request("http://localhost/api/cron/fetch-rss", {
      headers: { Authorization: "Bearer test-secret" },
    });
    const response = await loader({ request, params: {}, context: {} } as never);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  it("should return 401 when CRON_SECRET is not configured", async () => {
    const { CRON_SECRET: _, ...envWithoutCron } = originalEnv;
    process.env = envWithoutCron;

    const request = new Request("http://localhost/api/cron/fetch-rss", {
      headers: { Authorization: "Bearer some-token" },
    });
    const response = await loader({ request, params: {}, context: {} } as never);

    expect(response.status).toBe(401);
  });
});
