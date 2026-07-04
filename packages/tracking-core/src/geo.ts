export const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    "0.0.0.0"
  );
}

export async function lookupIpCountry(ip: string): Promise<string | undefined> {
  const apiKey = process.env.FRAUD_IP_API_KEY?.trim();
  if (!apiKey) return undefined;
  try {
    const res = await fetch(`https://ipinfo.io/${ip}/json?token=${apiKey}`, {
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) return undefined;
    const data = (await res.json()) as { country?: string };
    return data.country?.toUpperCase();
  } catch {
    return undefined;
  }
}
