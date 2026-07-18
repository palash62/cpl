import { prisma } from "@/lib/prisma";
import {
  DEFAULT_PLATFORM_PIXEL_CONFIG,
  normalizePlatformPixelInput,
  parsePlatformPixelConfig,
  PLATFORM_PIXEL_SETTINGS_KEY,
  toPublicPlatformPixelConfig,
  type PlatformPixelConfig,
} from "@/lib/tracking/platform-pixel-settings";

async function loadStoredPixelConfig(): Promise<PlatformPixelConfig> {
  const row = await prisma.platformSetting.findUnique({
    where: { key: PLATFORM_PIXEL_SETTINGS_KEY },
  });
  if (!row) return { ...DEFAULT_PLATFORM_PIXEL_CONFIG };
  return parsePlatformPixelConfig(row.value);
}

export async function getPlatformPixelSettingsForAdmin() {
  return loadStoredPixelConfig();
}

export async function getPublicPlatformPixelConfig() {
  const config = await loadStoredPixelConfig();
  return toPublicPlatformPixelConfig(config);
}

export async function updatePlatformPixelSettings(
  input: {
    meta?: { enabled?: boolean; pixelId?: string };
    googleAds?: {
      enabled?: boolean;
      conversionId?: string;
      conversionLabel?: string;
    };
  },
  adminId: string,
) {
  const next = normalizePlatformPixelInput(input);

  await prisma.platformSetting.upsert({
    where: { key: PLATFORM_PIXEL_SETTINGS_KEY },
    create: { key: PLATFORM_PIXEL_SETTINGS_KEY, value: next as never },
    update: { value: next as never },
  });

  await prisma.auditLog.create({
    data: {
      actorId: adminId,
      action: "pixel.settings.updated",
      entityType: "platform_settings",
      entityId: PLATFORM_PIXEL_SETTINGS_KEY,
      metadata: {
        metaEnabled: next.meta.enabled,
        metaPixelId: next.meta.pixelId || null,
        googleAdsEnabled: next.googleAds.enabled,
        googleAdsConversionId: next.googleAds.conversionId || null,
      },
    },
  });

  return next;
}
