import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const dnsMock = vi.hoisted(() => ({
  resolve4: vi.fn<() => Promise<string[]>>(),
}));

vi.mock("node:dns/promises", () => ({
  default: dnsMock,
}));

import {
  getConfiguredPlatformPublicIp,
  getPlatformPublicIp,
  getPlatformPublicIps,
} from "@/lib/platform-host";

const ENV_KEYS = ["PLATFORM_PUBLIC_IP", "PLATFORM_URL", "APP_URL", "AUTH_URL", "NEXT_PUBLIC_PLATFORM_URL"] as const;

describe("getPlatformPublicIp", () => {
  const snapshot: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of ENV_KEYS) {
      snapshot[key] = process.env[key];
      delete process.env[key];
    }
    process.env.PLATFORM_URL = "https://leadvix.io";
    dnsMock.resolve4.mockReset();
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

  it("prefers PLATFORM_PUBLIC_IP over DNS (even when DNS is loopback)", async () => {
    process.env.PLATFORM_PUBLIC_IP = "13.235.217.121";
    dnsMock.resolve4.mockResolvedValue(["127.0.0.1"]);

    await expect(getPlatformPublicIp()).resolves.toBe("13.235.217.121");
    expect(getConfiguredPlatformPublicIp()).toBe("13.235.217.121");
    expect(dnsMock.resolve4).not.toHaveBeenCalled();
  });

  it("rejects private PLATFORM_PUBLIC_IP and falls back to public DNS", async () => {
    process.env.PLATFORM_PUBLIC_IP = "127.0.0.1";
    dnsMock.resolve4.mockResolvedValue(["127.0.0.1", "13.235.217.121"]);

    await expect(getPlatformPublicIp()).resolves.toBe("13.235.217.121");
  });

  it("ignores loopback-only DNS and returns null without env", async () => {
    dnsMock.resolve4.mockResolvedValue(["127.0.0.1"]);

    await expect(getPlatformPublicIp()).resolves.toBeNull();
  });

  it("getPlatformPublicIps includes env IP plus public DNS results", async () => {
    process.env.PLATFORM_PUBLIC_IP = "13.235.217.121";
    dnsMock.resolve4.mockResolvedValue(["127.0.0.1", "8.8.8.8"]);

    await expect(getPlatformPublicIps()).resolves.toEqual(["13.235.217.121", "8.8.8.8"]);
  });
});
