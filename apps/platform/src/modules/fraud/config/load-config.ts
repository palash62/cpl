import { prisma } from "@/lib/prisma";
import { DEFAULT_FRAUD_CONFIG, FRAUD_SETTINGS_KEY } from "./defaults";
import type { FraudConfig } from "../types/config";

function mergeConfig(partial: unknown): FraudConfig {
  if (!partial || typeof partial !== "object") return DEFAULT_FRAUD_CONFIG;
  const raw = partial as Record<string, unknown>;
  return {
    ...DEFAULT_FRAUD_CONFIG,
    ...raw,
    weights: {
      ...DEFAULT_FRAUD_CONFIG.weights,
      ...(typeof raw.weights === "object" && raw.weights ? raw.weights : {}),
    },
    enabledRules: {
      ...DEFAULT_FRAUD_CONFIG.enabledRules,
      ...(typeof raw.enabledRules === "object" && raw.enabledRules ? raw.enabledRules : {}),
    },
  } as FraudConfig;
}

export async function getFraudConfig(): Promise<FraudConfig> {
  const row = await prisma.platformSetting.findUnique({
    where: { key: FRAUD_SETTINGS_KEY },
  });
  return mergeConfig(row?.value);
}

export async function updateFraudConfig(
  partial: Partial<FraudConfig>,
  adminId: string,
): Promise<FraudConfig> {
  const current = await getFraudConfig();
  const next = mergeConfig({ ...current, ...partial });

  await prisma.platformSetting.upsert({
    where: { key: FRAUD_SETTINGS_KEY },
    create: { key: FRAUD_SETTINGS_KEY, value: next as never },
    update: { value: next as never },
  });

  await prisma.auditLog.create({
    data: {
      actorId: adminId,
      action: "fraud.config.updated",
      entityType: "platform_settings",
      entityId: FRAUD_SETTINGS_KEY,
      metadata: partial as never,
    },
  });

  return next;
}
