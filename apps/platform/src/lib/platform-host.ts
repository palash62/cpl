export function getPlatformUrl(): string {
  return (
    process.env.PLATFORM_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_PLATFORM_URL?.trim() ||
    "http://localhost:3010"
  );
}

export function getPlatformHost(): string {
  try {
    return new URL(getPlatformUrl()).host.toLowerCase();
  } catch {
    return "localhost:3010";
  }
}

export function getPlatformHosts(): Set<string> {
  const hosts = new Set<string>();
  for (const value of [
    process.env.PLATFORM_URL,
    process.env.APP_URL,
    process.env.NEXT_PUBLIC_PLATFORM_URL,
    process.env.AUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
  ]) {
    if (!value?.trim()) continue;
    try {
      hosts.add(new URL(value.trim()).host.toLowerCase());
    } catch {
      // ignore invalid URLs
    }
  }
  hosts.add("localhost");
  hosts.add("localhost:3010");
  hosts.add("127.0.0.1");
  hosts.add("127.0.0.1:3010");
  return hosts;
}

export function isPlatformHost(host: string | null | undefined): boolean {
  if (!host) return true;
  const normalized = host.toLowerCase().split(":")[0];
  const withPort = host.toLowerCase();
  const platformHosts = getPlatformHosts();
  return (
    platformHosts.has(withPort) ||
    platformHosts.has(normalized) ||
    platformHosts.has(`${normalized}:3010`)
  );
}

export function buildFunnelPublicUrl(input: {
  slug: string;
  appUrl: string;
  customDomain?: string | null;
}): string {
  if (input.customDomain) {
    // Mirror the platform URL's protocol/port so local dev (http://localhost:3010)
    // produces a clickable custom-domain URL like http://mybrand.test:3010.
    try {
      const base = new URL(input.appUrl);
      const port = base.port ? `:${base.port}` : "";
      return `${base.protocol}//${input.customDomain}${port}`;
    } catch {
      return `https://${input.customDomain}`;
    }
  }
  const base = input.appUrl.replace(/\/$/, "");
  return `${base}/o/${input.slug}`;
}
