import { prisma } from "@/lib/prisma";
import { Errors } from "@/lib/errors";
import { assertSafeOutboundUrl } from "@/lib/safe-url";
import { getTrackingUrl } from "@cpl/shared";
import {
  CPA_NETWORK_POSTBACK_SETTINGS_KEY,
  DEFAULT_CPA_NETWORK_POSTBACK_CONFIG,
  normalizeCpaNetworkPostbackInput,
  parseCpaNetworkPostbackConfig,
  type CpaNetworkPostbackConfig,
} from "@/lib/tracking/cpa-network-postback-settings";

async function loadConfig(): Promise<CpaNetworkPostbackConfig> {
  const row = await prisma.platformSetting.findUnique({
    where: { key: CPA_NETWORK_POSTBACK_SETTINGS_KEY },
  });
  if (!row) return { ...DEFAULT_CPA_NETWORK_POSTBACK_CONFIG };
  return parseCpaNetworkPostbackConfig(row.value);
}

export async function getCpaNetworkPostbackSettings() {
  const config = await loadConfig();
  const trackingBase = getTrackingUrl();
  const secureSuffix =
    config.useSecurityKey && config.securityKey
      ? `&secure=${encodeURIComponent(config.securityKey)}`
      : "";
  return {
    ...config,
    s2sPostbackUrlExample: `${trackingBase}/pbtr?click_id={click_id}&payout={payout}${secureSuffix}`,
    impressionPixelExample: `${trackingBase}/imptr`,
    conversionPixelExample: `${trackingBase}/pbtr?click_id={click_id}${secureSuffix}`,
  };
}

export async function getCpaNetworkPostbackConfigRaw(): Promise<CpaNetworkPostbackConfig> {
  return loadConfig();
}

export async function updateCpaNetworkPostbackSettings(
  input: {
    useSecurityKey?: boolean;
    securityKey?: string;
    parallelPostbackUrl?: string;
  },
  adminId: string,
) {
  let next: CpaNetworkPostbackConfig;
  try {
    next = normalizeCpaNetworkPostbackInput(input);
  } catch (error) {
    throw Errors.validation(error instanceof Error ? error.message : "Invalid settings");
  }

  if (next.parallelPostbackUrl) {
    const withoutMacros = next.parallelPostbackUrl.replace(/\{[a-z0-9_]+\}/gi, "placeholder");
    await assertSafeOutboundUrl(withoutMacros);
  }

  await prisma.platformSetting.upsert({
    where: { key: CPA_NETWORK_POSTBACK_SETTINGS_KEY },
    create: { key: CPA_NETWORK_POSTBACK_SETTINGS_KEY, value: next as never },
    update: { value: next as never },
  });

  await prisma.auditLog.create({
    data: {
      actorId: adminId,
      action: "cpa.network_postback.updated",
      entityType: "platform_settings",
      entityId: CPA_NETWORK_POSTBACK_SETTINGS_KEY,
      metadata: {
        useSecurityKey: next.useSecurityKey,
        hasSecurityKey: Boolean(next.securityKey),
        hasParallelPostback: Boolean(next.parallelPostbackUrl),
      },
    },
  });

  return getCpaNetworkPostbackSettings();
}
