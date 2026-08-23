import { prisma } from "@/lib/prisma";
import { DEFAULT_FRAUD_CONFIG, FRAUD_SETTINGS_KEY } from "./defaults";
import { DEFAULT_INTELLIGENCE_CONFIG } from "../intelligence/config";
import type { FraudConfig, FraudIntelligenceConfig } from "../types/config";

function mergeIntelligence(partial: unknown): FraudIntelligenceConfig {
  if (!partial || typeof partial !== "object") return DEFAULT_INTELLIGENCE_CONFIG;
  const raw = partial as Record<string, unknown>;
  const velocityRaw =
    typeof raw.velocity === "object" && raw.velocity ? (raw.velocity as Record<string, unknown>) : {};
  const weightsRaw =
    typeof raw.contextualWeights === "object" && raw.contextualWeights
      ? (raw.contextualWeights as Record<string, unknown>)
      : {};
  const levelsRaw =
    typeof raw.levels === "object" && raw.levels ? (raw.levels as Record<string, unknown>) : {};
  const identityRaw =
    typeof raw.identity === "object" && raw.identity ? (raw.identity as Record<string, unknown>) : {};

  return {
    ...DEFAULT_INTELLIGENCE_CONFIG,
    ...raw,
    velocity: {
      ip: { ...DEFAULT_INTELLIGENCE_CONFIG.velocity.ip, ...(velocityRaw.ip as object) },
      device: { ...DEFAULT_INTELLIGENCE_CONFIG.velocity.device, ...(velocityRaw.device as object) },
      publisher: {
        ...DEFAULT_INTELLIGENCE_CONFIG.velocity.publisher,
        ...(velocityRaw.publisher as object),
      },
      source: { ...DEFAULT_INTELLIGENCE_CONFIG.velocity.source, ...(velocityRaw.source as object) },
      campaign: {
        ...DEFAULT_INTELLIGENCE_CONFIG.velocity.campaign,
        ...(velocityRaw.campaign as object),
      },
    },
    contextualWeights: {
      ...DEFAULT_INTELLIGENCE_CONFIG.contextualWeights,
      ...weightsRaw,
    },
    levels: {
      ...DEFAULT_INTELLIGENCE_CONFIG.levels,
      ...levelsRaw,
    },
    identity: {
      ...DEFAULT_INTELLIGENCE_CONFIG.identity,
      ...identityRaw,
    },
  } as FraudIntelligenceConfig;
}

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
    intelligence: mergeIntelligence(raw.intelligence),
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
  const next = mergeConfig({
    ...current,
    ...partial,
    intelligence:
      partial.intelligence !== undefined
        ? { ...current.intelligence, ...partial.intelligence }
        : current.intelligence,
  });

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
