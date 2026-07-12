import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchEmailListVerifyStatus,
  mapEmailListVerifyStatus,
  validateEmailDeliverability,
} from "@/lib/email-deliverability";

describe("validateEmailDeliverability", () => {
  const originalFetch = global.fetch;
  const originalKey = process.env.FRAUD_EMAIL_API_KEY;

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalKey === undefined) {
      delete process.env.FRAUD_EMAIL_API_KEY;
    } else {
      process.env.FRAUD_EMAIL_API_KEY = originalKey;
    }
  });

  it("rejects invalid email format without calling provider", async () => {
    delete process.env.FRAUD_EMAIL_API_KEY;
    const fetchMock = vi.fn();
    global.fetch = fetchMock as typeof fetch;

    const result = await validateEmailDeliverability("not-an-email");
    expect(result).toEqual({ ok: false, reason: "Enter a valid email address." });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("allows valid email when provider is not configured", async () => {
    delete process.env.FRAUD_EMAIL_API_KEY;
    await expect(validateEmailDeliverability("user@example.com")).resolves.toEqual({ ok: true });
  });

  it("rejects disposable emails at signup", async () => {
    process.env.FRAUD_EMAIL_API_KEY = "test-key";
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => "disposable",
    }) as typeof fetch;

    const result = await validateEmailDeliverability("trash@mailinator.com");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("Disposable");
    }
  });

  it("allows ok provider response", async () => {
    process.env.FRAUD_EMAIL_API_KEY = "test-key";
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => "ok",
    }) as typeof fetch;

    await expect(validateEmailDeliverability("user@gmail.com")).resolves.toEqual({ ok: true });
  });

  it("fails open on provider auth errors", async () => {
    process.env.FRAUD_EMAIL_API_KEY = "bad-key";
    vi.spyOn(console, "warn").mockImplementation(() => {});
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => "Key_not_valid",
    }) as typeof fetch;

    await expect(validateEmailDeliverability("user@gmail.com")).resolves.toEqual({ ok: true });
  });
});

describe("fetchEmailListVerifyStatus", () => {
  const originalFetch = global.fetch;
  const originalKey = process.env.FRAUD_EMAIL_API_KEY;

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalKey === undefined) {
      delete process.env.FRAUD_EMAIL_API_KEY;
    } else {
      process.env.FRAUD_EMAIL_API_KEY = originalKey;
    }
  });

  it("returns null when API key is missing", async () => {
    delete process.env.FRAUD_EMAIL_API_KEY;
    await expect(fetchEmailListVerifyStatus("user@example.com")).resolves.toBeNull();
  });
});

describe("mapEmailListVerifyStatus", () => {
  it("maps invalid_mx to email_format outcome", () => {
    expect(mapEmailListVerifyStatus("invalid_mx")?.rule).toBe("email_format");
  });
});
