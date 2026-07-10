import { afterEach, describe, expect, it, vi } from "vitest";
import {
  countryFromRequestHeaders,
  getClientIp,
  isPrivateOrLocalIp,
  lookupIpCountry,
  normalizeClientIp,
} from "@cpl/shared";

describe("normalizeClientIp", () => {
  it("returns undefined for unknown or empty values", () => {
    expect(normalizeClientIp(undefined)).toBeUndefined();
    expect(normalizeClientIp("unknown")).toBeUndefined();
  });
});

describe("isPrivateOrLocalIp", () => {
  it("detects local and private ranges", () => {
    expect(isPrivateOrLocalIp("127.0.0.1")).toBe(true);
    expect(isPrivateOrLocalIp("192.168.1.4")).toBe(true);
    expect(isPrivateOrLocalIp("8.8.8.8")).toBe(false);
  });
});

describe("countryFromRequestHeaders", () => {
  it("reads supported edge country headers", () => {
    const headers = new Headers({ "cf-ipcountry": "in" });
    expect(countryFromRequestHeaders(headers)).toBe("IN");
  });

  it("ignores placeholder country codes", () => {
    const headers = new Headers({ "cf-ipcountry": "XX" });
    expect(countryFromRequestHeaders(headers)).toBeUndefined();
  });
});

describe("getClientIp", () => {
  it("prefers cloudflare connecting IP", () => {
    const headers = new Headers({
      "cf-connecting-ip": "203.0.113.10",
      "x-forwarded-for": "10.0.0.1",
    });
    expect(getClientIp(headers)).toBe("203.0.113.10");
  });

  it("uses x-real-ip before x-forwarded-for", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.10, 10.0.0.1",
      "x-real-ip": "10.0.0.2",
    });
    expect(getClientIp(headers)).toBe("10.0.0.2");
  });

  it("falls back to the first forwarded IP", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.10, 10.0.0.1",
    });
    expect(getClientIp(headers)).toBe("203.0.113.10");
  });
});

describe("lookupIpCountry", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.FRAUD_IP_API_KEY;
  });

  it("uses ipwho.is when no API key is configured", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, country_code: "US" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(lookupIpCountry("8.8.4.4")).resolves.toBe("US");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("ipwho.is"),
      expect.any(Object),
    );
  });

  it("prefers ipwho.is before ip-api when ipinfo is unavailable", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, country_code: "IN" }),
      });
    vi.stubGlobal("fetch", fetchMock);

    await expect(lookupIpCountry("203.0.113.44")).resolves.toBe("IN");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("ipwho.is"),
      expect.any(Object),
    );
  });

  it("skips lookup for private IPs", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(lookupIpCountry("127.0.0.1")).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
