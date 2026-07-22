import { describe, expect, it, vi, beforeEach } from "vitest";

const mockLookup = vi.fn();

vi.mock("node:dns/promises", () => ({
  lookup: (...args: unknown[]) => mockLookup(...args),
}));

import { assertSafeOutboundUrl, assertSafeSnsUrl } from "@/lib/safe-url";

describe("assertSafeOutboundUrl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLookup.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
  });

  it("allows public https hosts", async () => {
    const url = await assertSafeOutboundUrl("https://example.com/hook");
    expect(url.hostname).toBe("example.com");
  });

  it("blocks private IP literals", async () => {
    await expect(assertSafeOutboundUrl("https://127.0.0.1/hook")).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
    await expect(assertSafeOutboundUrl("https://10.0.0.5/hook")).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });

  it("allows http localhost catchers in non-production", async () => {
    const localhost = await assertSafeOutboundUrl("http://localhost:9876/hook");
    expect(localhost.hostname).toBe("localhost");
    const loopback = await assertSafeOutboundUrl("http://127.0.0.1:9876/hook");
    expect(loopback.hostname).toBe("127.0.0.1");
  });

  it("blocks non-https in production mode", async () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      await expect(assertSafeOutboundUrl("http://example.com/hook")).rejects.toMatchObject({
        code: "VALIDATION_ERROR",
      });
    } finally {
      process.env.NODE_ENV = prev;
    }
  });

  it("rejects hosts that resolve to private IPs", async () => {
    mockLookup.mockResolvedValue([{ address: "192.168.1.10", family: 4 }]);
    await expect(assertSafeOutboundUrl("https://internal.example/hook")).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });
});

describe("assertSafeSnsUrl", () => {
  it("allows sns amazonaws hosts", async () => {
    const url = await assertSafeSnsUrl(
      "https://sns.us-east-1.amazonaws.com/?Action=ConfirmSubscription&Token=abc",
    );
    expect(url.hostname).toBe("sns.us-east-1.amazonaws.com");
  });

  it("rejects non-SNS hosts", async () => {
    await expect(assertSafeSnsUrl("https://evil.com/subscribe")).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });
});
