import {
  mergeStripeConfig,
  normalizeStripeInput,
  parseStripeConfigStored,
  stripeConfigToApi,
  STRIPE_SETTINGS_KEY,
  type StripeConfigStored,
} from "@/lib/payments/stripe-settings";
import { prisma } from "@/lib/prisma";

async function loadStoredStripeConfig(): Promise<StripeConfigStored | null> {
  const row = await prisma.platformSetting.findUnique({
    where: { key: STRIPE_SETTINGS_KEY },
  });
  return row ? parseStripeConfigStored(row.value) : null;
}

export async function getResolvedStripeConfig() {
  const stored = await loadStoredStripeConfig();
  return mergeStripeConfig(stored);
}

export async function getStripeSettingsForAdmin() {
  const stored = await loadStoredStripeConfig();
  const config = mergeStripeConfig(stored);
  return stripeConfigToApi(
    config,
    Boolean(stored?.secretKey || process.env.STRIPE_SECRET_KEY),
    Boolean(stored?.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET),
  );
}

export async function updateStripeSettings(
  input: {
    publishableKey?: string;
    secretKey?: string;
    webhookSecret?: string;
  },
  adminId: string,
) {
  const existing = await loadStoredStripeConfig();
  const normalized = normalizeStripeInput(input);

  const next: StripeConfigStored = {
    publishableKey: normalized.publishableKey,
    secretKey: normalized.secretKey ?? existing?.secretKey,
    webhookSecret: normalized.webhookSecret ?? existing?.webhookSecret,
  };

  if (!next.publishableKey || !next.secretKey) {
    await prisma.platformSetting.deleteMany({ where: { key: STRIPE_SETTINGS_KEY } });
  } else {
    await prisma.platformSetting.upsert({
      where: { key: STRIPE_SETTINGS_KEY },
      create: { key: STRIPE_SETTINGS_KEY, value: next as never },
      update: { value: next as never },
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: adminId,
      action: "stripe.settings.updated",
      entityType: "platform_settings",
      entityId: STRIPE_SETTINGS_KEY,
      metadata: {
        publishableKeyPrefix: next.publishableKey?.slice(0, 12),
        secretKeyUpdated: Boolean(normalized.secretKey),
        webhookSecretUpdated: Boolean(normalized.webhookSecret),
      },
    },
  });

  return getStripeSettingsForAdmin();
}
