import dns from "node:dns/promises";
import net from "node:net";
import { isPrivateOrLocalIp } from "@cpl/shared";
import { getPlatformHost } from "@/lib/platform-host";

const IPV4_RE = /^(?:\d{1,3}\.){3}\d{1,3}$/;

/** Valid public IPv4 from PLATFORM_PUBLIC_IP, or null. */
export function getConfiguredPlatformPublicIp(): string | null {
  const raw = process.env.PLATFORM_PUBLIC_IP?.trim();
  if (!raw || !IPV4_RE.test(raw) || !net.isIPv4(raw)) return null;
  if (isPrivateOrLocalIp(raw)) return null;
  return raw;
}

function isPublicIpv4(ip: string): boolean {
  return net.isIPv4(ip) && !isPrivateOrLocalIp(ip);
}

/**
 * Public A-record IP for custom-domain DNS instructions and verification.
 * Prefer PLATFORM_PUBLIC_IP — Docker/host /etc/hosts often maps the platform
 * hostname to 127.0.0.1 for the reverse proxy.
 *
 * Kept out of platform-host.ts so Edge middleware can import that module safely.
 */
export async function getPlatformPublicIp(): Promise<string | null> {
  const configured = getConfiguredPlatformPublicIp();
  if (configured) return configured;

  const host = getPlatformHost().split(":")[0];
  try {
    const ips = await dns.resolve4(host);
    return ips.find(isPublicIpv4) ?? null;
  } catch {
    return null;
  }
}

/** All public IPs that count as “pointing at the platform” for A-record verify. */
export async function getPlatformPublicIps(): Promise<string[]> {
  const ips = new Set<string>();
  const configured = getConfiguredPlatformPublicIp();
  if (configured) ips.add(configured);

  const host = getPlatformHost().split(":")[0];
  try {
    for (const ip of await dns.resolve4(host)) {
      if (isPublicIpv4(ip)) ips.add(ip);
    }
  } catch {
    // ignore DNS failures; env IP alone may still verify
  }

  return [...ips];
}
