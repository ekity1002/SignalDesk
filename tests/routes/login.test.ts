import { describe, expect, it, vi } from "vitest";

// Mock auth modules
vi.mock("~/lib/auth/auth.server", () => ({
  validatePassword: vi.fn((password: string) => password === "correct-password"),
}));

vi.mock("~/lib/auth/session.server", () => {
  const sessionData: Record<string, unknown> = {};
  const flashData: Record<string, unknown> = {};

  return {
    getSession: vi.fn(() =>
      Promise.resolve({
        get: (key: string) => sessionData[key] ?? flashData[key],
        set: (key: string, value: unknown) => {
          sessionData[key] = value;
        },
        flash: (key: string, value: unknown) => {
          flashData[key] = value;
        },
      }),
    ),
    commitSession: vi.fn(() => Promise.resolve("session-cookie")),
  };
});

// Import after mocks
import { action } from "~/routes/login";

function createRequest(url: string, formData: Record<string, string>): Request {
  const body = new FormData();
  for (const [key, value] of Object.entries(formData)) {
    body.append(key, value);
  }
  return new Request(url, {
    method: "POST",
    body,
  });
}

function createActionArgs(request: Request) {
  return { request, params: {}, context: {} } as Parameters<typeof action>[0];
}

describe("login action", () => {
  describe("redirectTo parameter preservation", () => {
    it("should preserve redirectTo on validation error", async () => {
      const request = createRequest("http://localhost/login?redirectTo=/dashboard", {
        password: "",
      });

      const response = await action(createActionArgs(request));

      expect(response.status).toBe(302);
      const location = response.headers.get("Location");
      expect(location).toBe("/login?redirectTo=%2Fdashboard");
    });

    it("should preserve redirectTo on invalid password", async () => {
      const request = createRequest("http://localhost/login?redirectTo=/settings", {
        password: "wrong-password",
      });

      const response = await action(createActionArgs(request));

      expect(response.status).toBe(302);
      const location = response.headers.get("Location");
      expect(location).toBe("/login?redirectTo=%2Fsettings");
    });

    it("should redirect to specified path on successful login", async () => {
      const request = createRequest("http://localhost/login?redirectTo=/dashboard", {
        password: "correct-password",
      });

      const response = await action(createActionArgs(request));

      expect(response.status).toBe(302);
      const location = response.headers.get("Location");
      expect(location).toBe("/dashboard");
    });

    it("should redirect to / when no redirectTo provided", async () => {
      const request = createRequest("http://localhost/login", {
        password: "correct-password",
      });

      const response = await action(createActionArgs(request));

      expect(response.status).toBe(302);
      const location = response.headers.get("Location");
      expect(location).toBe("/");
    });

    it("should redirect to /login without param when no redirectTo on error", async () => {
      const request = createRequest("http://localhost/login", {
        password: "",
      });

      const response = await action(createActionArgs(request));

      expect(response.status).toBe(302);
      const location = response.headers.get("Location");
      expect(location).toBe("/login");
    });
  });
});
