export const PLATFORM_PIXEL_SETTINGS_KEY = "platform_pixel_config";

export type MetaPixelConfig = {
  enabled: boolean;
  pixelId: string;
};

export type GoogleAdsPixelConfig = {
  enabled: boolean;
  conversionId: string;
  conversionLabel: string;
};

export type PlatformPixelConfig = {
  version: 1;
  meta: MetaPixelConfig;
  googleAds: GoogleAdsPixelConfig;
};

export type PublicPlatformPixelConfig = {
  meta: MetaPixelConfig | null;
  googleAds: GoogleAdsPixelConfig | null;
};

export const DEFAULT_PLATFORM_PIXEL_CONFIG: PlatformPixelConfig = {
  version: 1,
  meta: { enabled: false, pixelId: "" },
  googleAds: { enabled: false, conversionId: "", conversionLabel: "" },
};

const META_PIXEL_ID_RE = /^\d{5,20}$/;
const GOOGLE_CONVERSION_ID_RE = /^AW-\d{5,20}$/i;

export function isValidMetaPixelId(value: string): boolean {
  return META_PIXEL_ID_RE.test(value.trim());
}

export function isValidGoogleConversionId(value: string): boolean {
  return GOOGLE_CONVERSION_ID_RE.test(value.trim());
}

export function normalizeMetaPixelId(value: string): string {
  return value.trim();
}

export function normalizeGoogleConversionId(value: string): string {
  const trimmed = value.trim().toUpperCase();
  if (!trimmed) return "";
  if (trimmed.startsWith("AW-")) return trimmed;
  if (/^\d{5,20}$/.test(trimmed)) return `AW-${trimmed}`;
  return trimmed;
}

export function normalizeGoogleConversionLabel(value: string): string {
  return value.trim();
}

export function parsePlatformPixelConfig(value: unknown): PlatformPixelConfig {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_PLATFORM_PIXEL_CONFIG };
  }

  const raw = value as Record<string, unknown>;
  const metaRaw =
    raw.meta && typeof raw.meta === "object"
      ? (raw.meta as Record<string, unknown>)
      : {};
  const googleRaw =
    raw.googleAds && typeof raw.googleAds === "object"
      ? (raw.googleAds as Record<string, unknown>)
      : {};

  return {
    version: 1,
    meta: {
      enabled: Boolean(metaRaw.enabled),
      pixelId:
        typeof metaRaw.pixelId === "string"
          ? normalizeMetaPixelId(metaRaw.pixelId)
          : "",
    },
    googleAds: {
      enabled: Boolean(googleRaw.enabled),
      conversionId:
        typeof googleRaw.conversionId === "string"
          ? normalizeGoogleConversionId(googleRaw.conversionId)
          : "",
      conversionLabel:
        typeof googleRaw.conversionLabel === "string"
          ? normalizeGoogleConversionLabel(googleRaw.conversionLabel)
          : "",
    },
  };
}

export function normalizePlatformPixelInput(input: {
  meta?: { enabled?: boolean; pixelId?: string };
  googleAds?: {
    enabled?: boolean;
    conversionId?: string;
    conversionLabel?: string;
  };
}): PlatformPixelConfig {
  return {
    version: 1,
    meta: {
      enabled: Boolean(input.meta?.enabled),
      pixelId: normalizeMetaPixelId(input.meta?.pixelId ?? ""),
    },
    googleAds: {
      enabled: Boolean(input.googleAds?.enabled),
      conversionId: normalizeGoogleConversionId(input.googleAds?.conversionId ?? ""),
      conversionLabel: normalizeGoogleConversionLabel(
        input.googleAds?.conversionLabel ?? "",
      ),
    },
  };
}

export function toPublicPlatformPixelConfig(
  config: PlatformPixelConfig,
): PublicPlatformPixelConfig {
  return {
    meta:
      config.meta.enabled && isValidMetaPixelId(config.meta.pixelId)
        ? { enabled: true, pixelId: config.meta.pixelId }
        : null,
    googleAds:
      config.googleAds.enabled &&
      isValidGoogleConversionId(config.googleAds.conversionId) &&
      config.googleAds.conversionLabel.length > 0
        ? {
            enabled: true,
            conversionId: config.googleAds.conversionId,
            conversionLabel: config.googleAds.conversionLabel,
          }
        : null,
  };
}

export function googleAdsSendTo(config: GoogleAdsPixelConfig): string {
  return `${config.conversionId}/${config.conversionLabel}`;
}
