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
} from "../lib/encrypt-secrets";
import { verifyGetResponseConfig } from "../providers/getresponse.provider";
import type { ConnectionInput, ConnectionPublic } from "../types/connection";
import type { ConnectionConfig, GetResponseConfig } from "../types/provider";

function toPublic(row: Awaited<ReturnType<typeof listConnectionsByAdvertiser>>[number]): ConnectionPublic {
  const config = row.config as Record<string, unknown>;
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
    if (val === "••••••••" || val === undefined || val === "") {
      if (existing[key] !== undefined) merged[key] = existing[key];
    }
  }
  return merged;
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

async function assertProviderConfig(provider: ConnectionInput["provider"], config: ConnectionConfig) {
  if (provider === "GETRESPONSE") {
    const result = await verifyGetResponseConfig(config as GetResponseConfig);
    if (!result.ok) {
      throw new AppError(
        "VALIDATION_ERROR",
        result.error ?? "GetResponse credentials are invalid",
        422,
      );
    }
  }

  if (provider === "WEBHOOK") {
    const url = (config as { url?: string }).url?.trim() ?? "";
    if (!url) {
      throw new AppError("VALIDATION_ERROR", "Webhook URL is required", 422);
    }
  }
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

  await assertProviderConfig(input.provider, input.config);

  const encrypted = encryptConfigSecrets(input.config as Record<string, unknown>);
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
  const nextConfig = input.config
    ? encryptConfigSecrets(mergeConfig(existingConfig, input.config))
    : undefined;

  if (nextConfig) {
    await assertProviderConfig(
      existing.provider,
      decryptConfigSecrets(nextConfig) as ConnectionConfig,
    );
  }

  await updateConnection(id, advertiserId, {
    ...(input.name !== undefined && { name: input.name }),
    ...(input.trigger !== undefined && { trigger: input.trigger }),
    ...(input.campaignId !== undefined && { campaignId: input.campaignId }),
    ...(input.isEnabled !== undefined && { isEnabled: input.isEnabled }),
    ...(nextConfig !== undefined && { config: nextConfig }),
    ...(input.fieldMapping !== undefined && { fieldMapping: input.fieldMapping }),
  });

  return getConnection(id, advertiserId);
}

export async function deleteAdvertiserConnection(id: string, advertiserId: string) {
  const result = await deleteConnection(id, advertiserId);
  if (result.count === 0) throw Errors.notFound("Autoresponder connection");
}

export function getDecryptedConfig(config: object): ConnectionConfig {
  return decryptConfigSecrets(config as Record<string, unknown>) as ConnectionConfig;
}
