import { lookup } from "node:dns/promises";
import net from "node:net";
import { Errors } from "@/lib/errors";

/** Same-origin relative path only: `/admin`, not `//evil.com` or `https://…`. */
export function assertSafeRelativeRedirect(path: string | null | undefined, fallback = "/"): string {
  const value = (path ?? fallback).trim() || fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }
  if (value.includes("://")) {
    return fallback;
  }
  return value;
}

export function isSafeHttpUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const parts = ip.split(".").map(Number);
    const [a, b] = parts;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    return false;
  }

  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    if (normalized === "::1") return true;
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true; // ULA
    if (normalized.startsWith("fe80")) return true; // link-local
    if (normalized.startsWith("::ffff:")) {
      return isPrivateIp(normalized.slice(7));
    }
    return false;
  }

  return true;
}

function isAwsSnsHost(hostname: string): boolean {
  return /^sns\.[a-z0-9-]+\.amazonaws\.com$/i.test(hostname);
}

/**
 * Blocks private / link-local / metadata hosts for advertiser-controlled outbound fetches.
 * Production requires https; non-production may use http://localhost.
 */
export async function assertSafeOutboundUrl(
  raw: string,
  options?: { allowHttpLocalhost?: boolean; allowSnsHosts?: boolean },
): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw Errors.validation("Invalid URL");
  }

  const allowHttpLocalhost =
    options?.allowHttpLocalhost ?? process.env.NODE_ENV !== "production";

  if (parsed.protocol === "https:") {
    // ok
  } else if (
    parsed.protocol === "http:" &&
    allowHttpLocalhost &&
    (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1")
  ) {
    // Explicit local catchers in non-production — skip SSRF private-IP DNS checks.
    return parsed;
  } else {
    throw Errors.validation("Outbound URL must use HTTPS");
  }

  if (parsed.username || parsed.password) {
    throw Errors.validation("Outbound URL must not include credentials");
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, "");

  if (options?.allowSnsHosts && isAwsSnsHost(hostname)) {
    return parsed;
  }

  if (hostname === "localhost" || hostname === "metadata.google.internal") {
    if (!(allowHttpLocalhost && hostname === "localhost")) {
      throw Errors.validation("Outbound URL host is not allowed");
    }
  }

  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      throw Errors.validation("Outbound URL host is not allowed");
    }
    return parsed;
  }

  let addresses: string[] = [];
  try {
    const result = await lookup(hostname, { all: true });
    addresses = result.map((entry) => entry.address);
  } catch {
    throw Errors.validation("Outbound URL host could not be resolved");
  }

  if (addresses.length === 0 || addresses.some((ip) => isPrivateIp(ip))) {
    throw Errors.validation("Outbound URL host is not allowed");
  }

  return parsed;
}

export async function assertSafeSnsUrl(raw: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw Errors.validation("Invalid SNS URL");
  }

  if (parsed.protocol !== "https:") {
    throw Errors.validation("SNS URL must use HTTPS");
  }

  if (!isAwsSnsHost(parsed.hostname)) {
    throw Errors.validation("SNS URL host is not allowed");
  }

  return parsed;
}
