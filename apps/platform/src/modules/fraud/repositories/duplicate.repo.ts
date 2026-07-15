import { prisma } from "@/lib/prisma";

export async function loadDuplicateContext(
  campaignId: string,
  duplicateWindowDays: number,
  _ipWindowHours: number,
) {
  const since = new Date();
  since.setDate(since.getDate() - duplicateWindowDays);

  const [leads, ipLeads] = await Promise.all([
    prisma.lead.findMany({
      where: {
        campaignId,
        createdAt: { gte: since },
        status: { notIn: ["REJECTED"] },
        isTest: false,
      },
      select: { data: true, deviceFingerprint: true },
    }),
    prisma.lead.findMany({
      where: {
        campaignId,
        createdAt: { gte: since },
        ip: { not: null },
        isTest: false,
      },
      select: { ip: true },
    }),
  ]);

  const existingEmails = leads
    .map((l) => (l.data as Record<string, string>).email?.toLowerCase())
    .filter(Boolean) as string[];

  const existingPhones = leads
    .map((l) => (l.data as Record<string, string>).phone?.replace(/\D/g, ""))
    .filter(Boolean) as string[];

  const existingIps = ipLeads.map((l) => l.ip!).filter(Boolean);

  const existingFingerprints = leads
    .map((l) => l.deviceFingerprint)
    .filter(Boolean) as string[];

  return { existingEmails, existingPhones, existingIps, existingFingerprints };
}

export async function recordDeviceSeen(
  fingerprintHash: string,
  campaignId: string,
  leadId: string,
) {
  if (!fingerprintHash) return;
  await prisma.leadDeviceSeen.create({
    data: { fingerprintHash, campaignId, leadId },
  });
}

export async function getLatestClickIp(trackingLinkId?: string) {
  if (!trackingLinkId) return undefined;
  const click = await prisma.click.findFirst({
    where: { trackingLinkId },
    orderBy: { createdAt: "desc" },
    select: { ip: true },
  });
  return click?.ip ?? undefined;
}
