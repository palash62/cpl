import { prisma } from "@/lib/prisma";

export async function recordPixelFire(input: {
  pixelToken: string;
  leadId?: string;
  txnId?: string;
  ip?: string;
  userAgent?: string;
}) {
  const campaign = await prisma.campaign.findUnique({
    where: { pixelToken: input.pixelToken },
    select: { id: true, status: true },
  });

  if (!campaign || campaign.status === "ARCHIVED") {
    return null;
  }

  let leadId: string | undefined;

  if (input.leadId) {
    const lead = await prisma.lead.findFirst({
      where: { id: input.leadId, campaignId: campaign.id },
      select: { id: true },
    });
    leadId = lead?.id;
  }

  return prisma.pixelEvent.create({
    data: {
      campaignId: campaign.id,
      leadId,
      txnId: input.txnId?.trim() || undefined,
      ip: input.ip,
      userAgent: input.userAgent,
    },
  });
}
