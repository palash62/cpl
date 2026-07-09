import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { encryptSecret, decryptSecret, maskConfigForApi } from "@/modules/autoresponder/lib/encrypt-secrets";
import { buildLeadPayload } from "@/modules/autoresponder/mapping/build-payload";
import { sendWebhook } from "@/modules/autoresponder/providers/webhook.provider";
import { sendSysteme, verifySystemeConfig } from "@/modules/autoresponder/providers/systeme.provider";

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
      { ...(baseLead as object), data: { first_name: "Jane" } } as never,
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

describe("verifySystemeConfig", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects missing API key", async () => {
    const result = await verifySystemeConfig({ apiKey: "" });
    expect(result.ok).toBe(false);
    expect(result.error).toContain("API key");
  });

  it("rejects invalid API key", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => "Unauthorized",
    });

    const result = await verifySystemeConfig({ apiKey: "bad-key" });
    expect(result.ok).toBe(false);
    expect(result.error).toContain("invalid");
  });

  it("accepts valid API key without tag", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => '{"items":[]}',
    });

    const result = await verifySystemeConfig({ apiKey: "good-key" });
    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://api.systeme.io/api/contacts?limit=10");
  });

  it("surfaces Systeme limit validation errors", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 422,
      text: async () =>
        JSON.stringify({
          violations: [{ message: "This value should be between 10 and 100.", propertyPath: "limit" }],
        }),
    });

    const result = await verifySystemeConfig({ apiKey: "good-key" });
    expect(result.ok).toBe(false);
    expect(result.error).toContain("between 10 and 100");
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://api.systeme.io/api/contacts?limit=10");
  });

  it("rejects unknown tag ID", async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, status: 200, text: async () => '{"items":[]}' })
      .mockResolvedValueOnce({ ok: false, status: 404, text: async () => "" });

    const result = await verifySystemeConfig({ apiKey: "good-key", tagId: "12345" });
    expect(result.ok).toBe(false);
    expect(result.error).toContain("12345");
  });
});

describe("sendSysteme", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates contact without tag", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ id: 99 }),
      text: async () => "",
    });

    const result = await sendSysteme(
      { apiKey: "good-key" },
      {
        event: "lead.captured",
        leadId: "1",
        email: "lead@example.com",
        firstName: "Jane",
        campaign: { id: "c", name: "C" },
        publisher: { id: "p", name: "P" },
        submittedAt: new Date().toISOString(),
      },
    );

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://api.systeme.io/api/contacts");
  });

  it("assigns tag after contact creation", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ id: 42 }),
        text: async () => "",
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => "",
      });

    const result = await sendSysteme(
      { apiKey: "good-key", tagId: "7" },
      {
        event: "lead.captured",
        leadId: "1",
        email: "lead@example.com",
        campaign: { id: "c", name: "C" },
        publisher: { id: "p", name: "P" },
        submittedAt: new Date().toISOString(),
      },
    );

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[0]).toBe("https://api.systeme.io/api/contacts/42/tags");
    expect(JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body))).toEqual({ tagId: 7 });
  });
});
