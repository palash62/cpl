import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  checkEmailWithProvider,
  mapEmailListVerifyStatus,
} from "@/modules/fraud/providers/registry";
import { DEFAULT_FRAUD_CONFIG } from "@/modules/fraud/config/defaults";

describe("mapEmailListVerifyStatus", () => {
  it("returns null for ok and unknown", () => {
    expect(mapEmailListVerifyStatus("ok")).toBeNull();
    expect(mapEmailListVerifyStatus("unknown")).toBeNull();
  });

  it("hard-fails disposable emails", () => {
    const outcome = mapEmailListVerifyStatus("disposable");
    expect(outcome?.rule).toBe("disposable_email");
    expect(outcome?.passed).toBe(false);
    expect(outcome?.hardFail).toBe(true);
    expect(outcome?.riskDelta).toBe(DEFAULT_FRAUD_CONFIG.weights.disposable_email);
  });

  it("flags role emails without hard fail", () => {
    const outcome = mapEmailListVerifyStatus("role");
    expect(outcome?.rule).toBe("role_email");
    expect(outcome?.passed).toBe(false);
    expect(outcome?.hardFail).toBe(false);
  });

  it("flags invalid deliverability statuses", () => {
    const outcome = mapEmailListVerifyStatus("invalid_mx");
    expect(outcome?.rule).toBe("email_format");
    expect(outcome?.passed).toBe(false);
    expect(outcome?.details).toContain("invalid_mx");
  });

  it("flags catch-all domains as risky role-style emails", () => {
    const outcome = mapEmailListVerifyStatus("accept_all");
    expect(outcome?.rule).toBe("role_email");
    expect(outcome?.details).toContain("Catch-all");
  });
});

describe("checkEmailWithProvider", () => {
  const originalFetch = global.fetch;
  const originalKey = process.env.FRAUD_EMAIL_API_KEY;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalKey === undefined) {
      delete process.env.FRAUD_EMAIL_API_KEY;
    } else {
      process.env.FRAUD_EMAIL_API_KEY = originalKey;
    }
  });

  it("returns null when API key is not set", async () => {
    delete process.env.FRAUD_EMAIL_API_KEY;
    await expect(checkEmailWithProvider("user@example.com")).resolves.toBeNull();
  });

  it("maps disposable provider response to hard-fail outcome", async () => {
    process.env.FRAUD_EMAIL_API_KEY = "test-key";
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => "disposable",
    }) as typeof fetch;

    const outcome = await checkEmailWithProvider("trash@mailinator.com");
    expect(outcome?.rule).toBe("disposable_email");
    expect(outcome?.hardFail).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://apps.emaillistverify.com/api/verifyEmail?secret=test-key&email=trash%40mailinator.com",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("maps role provider response to role_email outcome", async () => {
    process.env.FRAUD_EMAIL_API_KEY = "test-key";
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => "role",
    }) as typeof fetch;

    const outcome = await checkEmailWithProvider("admin@company.com");
    expect(outcome?.rule).toBe("role_email");
    expect(outcome?.hardFail).toBe(false);
  });

  it("returns null for ok provider response", async () => {
    process.env.FRAUD_EMAIL_API_KEY = "test-key";
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => "ok",
    }) as typeof fetch;

    await expect(checkEmailWithProvider("user@example.com")).resolves.toBeNull();
  });

  it("fails open on provider auth errors", async () => {
    process.env.FRAUD_EMAIL_API_KEY = "bad-key";
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => "Key_not_valid",
    }) as typeof fetch;

    await expect(checkEmailWithProvider("user@example.com")).resolves.toBeNull();
    expect(warn).toHaveBeenCalled();
  });
});
