import type { AutoresponderProvider } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendViaProvider } from "../providers/registry";
import { buildAutoresponderTestEmail } from "../lib/test-email";
import {
  getConnection,
  getDecryptedConfig,
  persistAweberTokenRefresh,
} from "./connection.service";
import { getConnectionById } from "../repositories/connection.repo";
import type { LeadAutoresponderPayload } from "../types/payload";

function buildSamplePayload(email: string): LeadAutoresponderPayload {
  return {
    event: "lead.captured",
    leadId: "test_lead_id",
    email,
    firstName: "Test",
    lastName: "User",
    phone: "+15551234567",
    country: "US",
    campaign: { id: "test_campaign", name: "Test Campaign" },
    publisher: { id: "test_publisher" },
    source: "test",
    subId: "test-sub",
    submittedAt: new Date().toISOString(),
  };
}

export async function testConnection(id: string, advertiserId: string) {
  const connection = await getConnection(id, advertiserId);
  const row = await getConnectionById(id, advertiserId);
  if (!row) throw new Error("Connection not found");

  const advertiser = await prisma.user.findUnique({
    where: { id: advertiserId },
    select: { email: true },
  });

  const config = getDecryptedConfig(row.config as object);
  const testEmail = buildAutoresponderTestEmail(advertiser?.email);

  const result = await sendViaProvider(
    connection.provider as AutoresponderProvider,
    config,
    {
      ...buildSamplePayload(testEmail),
      event: connection.trigger === "LEAD_APPROVED" ? "lead.approved" : "lead.captured",
    },
  );

  if (result.refreshedAweberConfig) {
    await persistAweberTokenRefresh(
      id,
      advertiserId,
      config as Record<string, unknown>,
      result.refreshedAweberConfig,
    );
  }

  return result;
}
