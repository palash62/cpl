import type { AutoresponderTrigger } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DEFAULT_AUTORESPONDER_PLATFORM_CONFIG } from "../config/defaults";
import { buildLeadPayload } from "../mapping/build-payload";
import { listMatchingConnections } from "../repositories/connection.repo";
import {
  createDelivery,
  findExistingDelivery,
  updateDelivery,
} from "../repositories/delivery.repo";
import { sendViaProvider } from "../providers/registry";
import { getDecryptedConfig, persistAweberTokenRefresh } from "./connection.service";
import type { LeadAutoresponderPayload } from "../types/payload";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function attemptSend(
  provider: Awaited<ReturnType<typeof listMatchingConnections>>[number]["provider"],
  config: ReturnType<typeof getDecryptedConfig>,
  payload: LeadAutoresponderPayload,
) {
  let result = await sendViaProvider(provider, config, payload);
  if (!result.ok) {
    await sleep(DEFAULT_AUTORESPONDER_PLATFORM_CONFIG.retryDelayMs);
    result = await sendViaProvider(provider, config, payload);
  }
  return result;
}

async function processConnection(
  connection: Awaited<ReturnType<typeof listMatchingConnections>>[number],
  leadId: string,
  event: AutoresponderTrigger,
  payload: LeadAutoresponderPayload,
) {
  const existing = await findExistingDelivery(connection.id, leadId, event);
  if (existing?.status === "SUCCESS") return;

  let deliveryId = existing?.id;
  if (!deliveryId) {
    const created = await createDelivery({
      connectionId: connection.id,
      leadId,
      event,
      status: "PENDING",
      attemptCount: 0,
    });
    deliveryId = created.id;
  }

  const config = getDecryptedConfig(connection.config as object);
  const result = await attemptSend(connection.provider, config, payload);
  const attemptCount = (existing?.attemptCount ?? 0) + (result.ok ? 1 : 2);

  if (result.refreshedAweberConfig) {
    await persistAweberTokenRefresh(
      connection.id,
      connection.advertiserId,
      config as Record<string, unknown>,
      result.refreshedAweberConfig,
    );
  }

  await updateDelivery(deliveryId, {
    status: result.ok ? "SUCCESS" : "FAILED",
    attemptCount,
    httpStatus: result.httpStatus ?? null,
    error: result.error ?? null,
  });
}

export async function dispatchAutoresponderEvent(input: {
  leadId: string;
  event: AutoresponderTrigger;
}) {
  const lead = await prisma.lead.findUnique({
    where: { id: input.leadId },
    include: {
      campaign: { select: { id: true, name: true, advertiserId: true } },
      publisher: { select: { id: true, name: true } },
    },
  });

  if (!lead) return;
  if (lead.status === "REJECTED") return;
  if (input.event === "LEAD_APPROVED" && !["APPROVED", "PAID"].includes(lead.status)) return;

  const connections = await listMatchingConnections(
    lead.campaign.advertiserId,
    input.event,
    lead.campaignId,
  );

  if (connections.length === 0) return;

  await Promise.allSettled(
    connections.map(async (connection) => {
      const mapping = connection.fieldMapping as Record<string, string> | null;
      const payload = buildLeadPayload(lead, input.event, mapping);
      if (!payload) {
        const existing = await findExistingDelivery(connection.id, lead.id, input.event);
        if (!existing) {
          await createDelivery({
            connectionId: connection.id,
            leadId: lead.id,
            event: input.event,
            status: "SKIPPED",
            attemptCount: 0,
            error: "Missing email in lead data",
          });
        }
        return;
      }
      await processConnection(connection, lead.id, input.event, payload);
    }),
  );
}
