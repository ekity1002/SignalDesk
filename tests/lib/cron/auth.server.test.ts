import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createUnauthorizedResponse, verifyCronAuth } from "~/lib/cron/auth.server";

describe("verifyCronAuth", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("CRON_SECRETが未設定の場合はfalseを返す", () => {
    process.env.CRON_SECRET = undefined;
    const request = new Request("http://localhost/api/cron/test");
    expect(verifyCronAuth(request)).toBe(false);
  });

  it("Authorizationヘッダーが正しい場合はtrueを返す", () => {
    process.env.CRON_SECRET = "test-secret";
    const request = new Request("http://localhost/api/cron/test", {
      headers: {
        Authorization: "Bearer test-secret",
      },
    });
    expect(verifyCronAuth(request)).toBe(true);
  });

  it("Authorizationヘッダーが不正な場合はfalseを返す", () => {
    process.env.CRON_SECRET = "test-secret";
    const request = new Request("http://localhost/api/cron/test", {
      headers: {
        Authorization: "Bearer wrong-secret",
      },
    });
    expect(verifyCronAuth(request)).toBe(false);
  });

  it("x-vercel-cron-auth-tokenヘッダーが正しい場合はtrueを返す", () => {
    process.env.CRON_SECRET = "test-secret";
    const request = new Request("http://localhost/api/cron/test", {
      headers: {
        "x-vercel-cron-auth-token": "test-secret",
      },
    });
    expect(verifyCronAuth(request)).toBe(true);
  });

  it("x-vercel-cron-auth-tokenヘッダーが不正な場合はfalseを返す", () => {
    process.env.CRON_SECRET = "test-secret";
    const request = new Request("http://localhost/api/cron/test", {
      headers: {
        "x-vercel-cron-auth-token": "wrong-secret",
      },
    });
    expect(verifyCronAuth(request)).toBe(false);
  });

  it("ヘッダーがない場合はfalseを返す", () => {
    process.env.CRON_SECRET = "test-secret";
    const request = new Request("http://localhost/api/cron/test");
    expect(verifyCronAuth(request)).toBe(false);
  });
});

describe("createUnauthorizedResponse", () => {
  it("401ステータスでエラーレスポンスを返す", async () => {
    const response = createUnauthorizedResponse();
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });
});
