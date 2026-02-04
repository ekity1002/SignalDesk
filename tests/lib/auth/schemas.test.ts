import { describe, expect, it } from "vitest";
import { loginSchema } from "~/lib/auth/schemas";

describe("loginSchema", () => {
  it("should validate a valid password", () => {
    const result = loginSchema.safeParse({ password: "secret123" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.password).toBe("secret123");
    }
  });

  it("should reject empty password", () => {
    const result = loginSchema.safeParse({ password: "" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Password is required");
    }
  });

  it("should reject missing password field", () => {
    const result = loginSchema.safeParse({});

    expect(result.success).toBe(false);
  });
});
