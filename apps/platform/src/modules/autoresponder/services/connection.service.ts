import { prisma } from "@/lib/prisma";
import { Errors, AppError } from "@/lib/errors";
import { DEFAULT_AUTORESPONDER_PLATFORM_CONFIG } from "../config/defaults";
import {
  countConnectionsByAdvertiser,
  createConnection,
  deleteConnection,
  getConnectionById,
  listConnectionsByAdvertiser,
  updateConnection,
} from "../repositories/connection.repo";
import {
  decryptConfigSecrets,
  encryptConfigSecrets,
  maskConfigForApi,
  MASKED_SECRET,
  SECRET_CONFIG_KEYS,
} from "../lib/encrypt-secrets";
import { normalizeGetResponseConfig, verifyGetResponseConfig } from "../providers/getresponse.provider";
import { verifySystemeConfig } from "../providers/systeme.provider";
import { assertSafeOutboundUrl } from "@/lib/safe-url";
import type { ConnectionInput, ConnectionPublic } from "../types/connection";
import type { ConnectionConfig, GetResponseConfig } from "../types/provider";

function toPublic(row: Awaited<ReturnType<typeof listConnectionsByAdvertiser>>[number]): ConnectionPublic {
  const config = (row.config ?? {}) as Record<string, unknown>;
  return {
    ...row,
    config: maskConfigForApi(config),
  };
}

function mergeConfig(
  existing: Record<string, unknown>,
  incoming: ConnectionConfig,
): Record<string, unknown> {
  const merged = { ...existing, ...incoming } as Record<string, unknown>;
  for (const key of Object.keys(incoming as object)) {
    const val = (incoming as Record<string, unknown>)[key];
    const isSecret = SECRET_CONFIG_KEYS.has(key);

    if (val === MASKED_SECRET) {
      if (existing[key] !== undefined) merged[key] = existing[key];
      continue;
    }

    if ((val === undefined || val === "") && isSecret) {
      if (existing[key] !== undefined) merged[key] = existing[key];
    }
  }

  const nextCampaignId = (incoming as GetResponseConfig).campaignId?.trim();
  if (nextCampaignId) {
    delete merged.listId;
  }

  return merged;
}

function encryptConfigOrThrow(config: Record<string, unknown>): Record<string, unknown> {
  try {
    return encryptConfigSecrets(config);
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Unable to encrypt integration credentials. Check INTEGRATION_ENCRYPTION_KEY or AUTH_SECRET.";
    throw new AppError("VALIDATION_ERROR", message, 422);
  }
}

async function assertCampaignOwnedByAdvertiser(campaignId: string, advertiserId: string) {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, advertiserId },
    select: { id: true },
  });
  if (!campaign) {
    throw new AppError("VALIDATION_ERROR", "Campaign not found or not owned by you", 422);
  }
}

async function assertProviderConfig(
  provider: ConnectionInput["provider"],
  config: ConnectionConfig,
): Promise<ConnectionConfig> {
  if (provider === "GETRESPONSE") {
    const normalized = await normalizeGetResponseConfig(config as GetResponseConfig);
    const result = await verifyGetResponseConfig(normalized);
    if (!result.ok) {
      throw new AppError(
        "VALIDATION_ERROR",
        result.error ?? "GetResponse credentials are invalid",
        422,
      );
    }
    return normalized;
  }

  if (provider === "WEBHOOK") {
    const url = (config as { url?: string }).url?.trim() ?? "";
    if (!url) {
      throw new AppError("VALIDATION_ERROR", "Webhook URL is required", 422);
    }
    try {
      await assertSafeOutboundUrl(url);
    } catch (error) {
      throw new AppError(
        "VALIDATION_ERROR",
        error instanceof Error ? error.message : "Webhook URL is not allowed",
        422,
      );
    }
  }

  if (provider === "SYSTEME") {
    const apiKey = (config as { apiKey?: string }).apiKey?.trim() ?? "";
    const tagId = (config as { tagId?: string }).tagId?.trim() ?? "";
    if (!apiKey) {
      throw new AppError("VALIDATION_ERROR", "Systeme.io API key is required", 422);
    }
    if (tagId && !/^\d+$/.test(tagId)) {
      throw new AppError("VALIDATION_ERROR", "Systeme.io tag ID must be numeric", 422);
    }
    const verified = await verifySystemeConfig({ apiKey, ...(tagId ? { tagId } : {}) });
    if (!verified.ok) {
      throw new AppError(
        "VALIDATION_ERROR",
        verified.error ?? "Systeme.io credentials are invalid",
        422,
      );
    }
  }

  return config;
}

export async function listConnections(advertiserId: string) {
  const rows = await listConnectionsByAdvertiser(advertiserId);
  return rows.map(toPublic);
}

export async function getConnection(id: string, advertiserId: string) {
  const row = await getConnectionById(id, advertiserId);
  if (!row) throw Errors.notFound("Autoresponder connection");
  return toPublic(row);
}

export async function createAdvertiserConnection(advertiserId: string, input: ConnectionInput) {
  const count = await countConnectionsByAdvertiser(advertiserId);
  if (count >= DEFAULT_AUTORESPONDER_PLATFORM_CONFIG.maxConnectionsPerAdvertiser) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Maximum autoresponder connections reached",
      422,
    );
  }

  if (input.campaignId) {
    await assertCampaignOwnedByAdvertiser(input.campaignId, advertiserId);
  }

  const verifiedConfig = await assertProviderConfig(input.provider, input.config);
  const encrypted = encryptConfigOrThrow(verifiedConfig as Record<string, unknown>);
  const row = await createConnection({
    advertiserId,
    name: input.name,
    provider: input.provider,
    trigger: input.trigger,
    campaignId: input.campaignId ?? null,
    isEnabled: input.isEnabled ?? true,
    config: encrypted,
    fieldMapping: input.fieldMapping ?? null,
  });
  return toPublic(row);
}

export async function updateAdvertiserConnection(
  id: string,
  advertiserId: string,
  input: Partial<ConnectionInput>,
) {
  const existing = await getConnectionById(id, advertiserId);
  if (!existing) throw Errors.notFound("Autoresponder connection");

  if (input.campaignId) {
    await assertCampaignOwnedByAdvertiser(input.campaignId, advertiserId);
  }

  const existingConfig = existing.config as Record<string, unknown>;
  const existingDecrypted = decryptConfigSecrets(existingConfig);
  const mergedPlain = input.config
    ? mergeConfig(existingDecrypted, input.config)
    : undefined;
  const nextConfig = mergedPlain ? encryptConfigOrThrow(mergedPlain) : undefined;

  if (mergedPlain) {
    const verifiedConfig = await assertProviderConfig(
      existing.provider,
      mergedPlain as ConnectionConfig,
    );
    const encryptedVerified = encryptConfigOrThrow(verifiedConfig as Record<string, unknown>);
    const updated = await updateConnection(id, advertiserId, {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.trigger !== undefined && { trigger: input.trigger }),
      ...(input.campaignId !== undefined && { campaignId: input.campaignId }),
      ...(input.isEnabled !== undefined && { isEnabled: input.isEnabled }),
      config: encryptedVerified,
      ...(input.fieldMapping !== undefined && { fieldMapping: input.fieldMapping }),
    });

    if (updated.count === 0) throw Errors.notFound("Autoresponder connection");

    return getConnection(id, advertiserId);
  }

  const updated = await updateConnection(id, advertiserId, {
    ...(input.name !== undefined && { name: input.name }),
    ...(input.trigger !== undefined && { trigger: input.trigger }),
    ...(input.campaignId !== undefined && { campaignId: input.campaignId }),
    ...(input.isEnabled !== undefined && { isEnabled: input.isEnabled }),
    ...(nextConfig !== undefined && { config: nextConfig }),
    ...(input.fieldMapping !== undefined && { fieldMapping: input.fieldMapping }),
  });

  if (updated.count === 0) throw Errors.notFound("Autoresponder connection");

  return getConnection(id, advertiserId);
}

export async function deleteAdvertiserConnection(id: string, advertiserId: string) {
  const result = await deleteConnection(id, advertiserId);
  if (result.count === 0) throw Errors.notFound("Autoresponder connection");
}

export function getDecryptedConfig(config: object): ConnectionConfig {
  return decryptConfigSecrets(config as Record<string, unknown>) as ConnectionConfig;
}
