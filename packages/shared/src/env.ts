function trimUrl(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  if (!trimmed) return fallback;
  return trimmed.replace(/\/$/, "");
}

export function getPlatformUrl(): string {
  return trimUrl(
    process.env.NEXT_PUBLIC_PLATFORM_URL ?? process.env.APP_URL ?? process.env.PLATFORM_URL,
    "http://localhost:3000",
  );
}

export function getTrackingUrl(): string {
  return trimUrl(
    process.env.NEXT_PUBLIC_TRACKING_URL ?? process.env.TRACKING_URL,
    "http://localhost:3001",
  );
}

export function getInternalServiceToken(): string | undefined {
  return process.env.INTERNAL_SERVICE_TOKEN?.trim() || undefined;
}
