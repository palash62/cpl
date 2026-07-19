import net from "node:net";
import { lookup } from "node:dns/promises";

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
    if (a === 100 && b >= 64 && b <= 127) return true;
    return false;
  }
  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    if (normalized === "::1") return true;
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
    if (normalized.startsWith("fe80")) return true;
    if (normalized.startsWith("::ffff:")) {
      return isPrivateIp(normalized.slice(7));
    }
    return false;
  }
  return true;
}

export async function assertSafeOutboundUrl(
  raw: string,
  options?: { allowHttpLocalhost?: boolean },
): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error("Invalid URL");
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
    // ok in non-production
  } else {
    throw new Error("URL must use https");
  }

  if (parsed.username || parsed.password) {
    throw new Error("URL must not include credentials");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    if (!allowHttpLocalhost) {
      throw new Error("URL host is not allowed");
    }
    return parsed;
  }

  if (
    hostname === "metadata.google.internal" ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    throw new Error("URL host is not allowed");
  }

  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      throw new Error("URL host is not allowed");
    }
    return parsed;
  }

  const records = await lookup(hostname, { all: true });
  if (!records.length) throw new Error("URL host could not be resolved");
  for (const record of records) {
    if (isPrivateIp(record.address)) {
      throw new Error("URL host resolves to a private address");
    }
  }

  return parsed;
}

export function isHttpUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
