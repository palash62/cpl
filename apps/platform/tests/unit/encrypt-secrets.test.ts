import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret } from "@/modules/autoresponder/lib/encrypt-secrets";

const ENV_KEYS = ["INTEGRATION_ENCRYPTION_KEY", "AUTH_SECRET"] as const;

describe("encrypt-secrets env fallback", () => {
  const snapshot: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of ENV_KEYS) {
      snapshot[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (snapshot[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = snapshot[key];
      }
    }
  });

  it("falls back to AUTH_SECRET when INTEGRATION_ENCRYPTION_KEY is an empty string", () => {
    process.env.INTEGRATION_ENCRYPTION_KEY = "";
    process.env.AUTH_SECRET = "auth-secret-min-16-chars";

    const encrypted = encryptSecret("my-api-key");
    expect(decryptSecret(encrypted)).toBe("my-api-key");
  });

  it("prefers INTEGRATION_ENCRYPTION_KEY when set", () => {
    process.env.INTEGRATION_ENCRYPTION_KEY = "integration-key-min-16";
    process.env.AUTH_SECRET = "auth-secret-min-16-chars";

    const encrypted = encryptSecret("token-a");
    process.env.INTEGRATION_ENCRYPTION_KEY = "different-key-16chars";
    expect(() => decryptSecret(encrypted)).toThrow();
  });

  it("throws when both keys are blank", () => {
    process.env.INTEGRATION_ENCRYPTION_KEY = "";
    process.env.AUTH_SECRET = "";

    expect(() => encryptSecret("x")).toThrow(
      "INTEGRATION_ENCRYPTION_KEY or AUTH_SECRET (min 16 chars) required",
    );
  });
});
