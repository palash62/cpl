import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { encryptSecret, decryptSecret, maskConfigForApi } from "@/modules/autoresponder/lib/encrypt-secrets";
import { buildLeadPayload } from "@/modules/autoresponder/mapping/build-payload";
import { sendWebhook } from "@/modules/autoresponder/providers/webhook.provider";

describe("encrypt-secrets", () => {
  it("round-trips encrypted values", () => {
    process.env.AUTH_SECRET = "test-secret-key-min-32-characters-long";
    const enc = encryptSecret("my-api-key");
    expect(enc.startsWith("enc:")).toBe(true);
    expect(decryptSecret(enc)).toBe("my-api-key");
  });

  it("masks secrets for API responses", () => {
    const masked = maskConfigForApi({ apiKey: "secret", listId: "abc" });
    expect(masked.apiKey).toBe("••••••••");
    expect(masked.listId).toBe("abc");
  });
});

describe("buildLeadPayload", () => {
  const baseLead = {
    id: "lead_1",
    data: { email: "jane@example.com", first_name: "Jane", phone: "+15551234567" },
    country: "US",
    source: "facebook",
    subId: "sub1",
    createdAt: new Date("2026-06-30T12:00:00Z"),
    campaign: { id: "camp_1", name: "Demo" },
    publisher: { id: "pub_1", name: "Publisher" },
  } as never;

  it("builds payload with email", () => {
    const payload = buildLeadPayload(baseLead, "LEAD_CAPTURED");
    expect(payload?.email).toBe("jane@example.com");
    expect(payload?.firstName).toBe("Jane");
    expect(payload?.event).toBe("lead.captured");
  });

  it("returns null without email", () => {
    const payload = buildLeadPayload(
      { ...baseLead, data: { first_name: "Jane" } },
      "LEAD_CAPTURED",
    );
    expect(payload).toBeNull();
  });
});

describe("sendWebhook", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, text: async () => "" });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts JSON to webhook URL", async () => {
    const result = await sendWebhook(
      { url: "https://example.com/hook" },
      {
        event: "lead.captured",
        leadId: "1",
        email: "a@b.com",
        campaign: { id: "c", name: "C" },
        publisher: { id: "p", name: "P" },
        submittedAt: new Date().toISOString(),
      },
    );
    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.com/hook",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
