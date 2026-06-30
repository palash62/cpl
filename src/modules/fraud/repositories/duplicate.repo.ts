import { prisma } from "@/lib/prisma";
import { subHours } from "date-fns";

export async function loadDuplicateContext(campaignId: string, duplicateWindowDays: number, ipWindowHours: number) {
  const since = new Date();
  since.setDate(since.getDate() - duplicateWindowDays);
  const ipSince = subHours(new Date(), ipWindowHours);

  const leads = await prisma.lead.findMany({
    where: {
      campaignId,
      createdAt: { gte: since },
      status: { notIn: ["REJECTED"] },
    },
    select: { data: true, ip: true, deviceFingerprint: true, createdAt: true },
  });

  const existingEmails = leads
    .map((l) => (l.data as Record<string, string>).email?.toLowerCase())
    .filter(Boolean) as string[];

  const existingPhones = leads
    .map((l) => (l.data as Record<string, string>).phone?.replace(/\D/g, ""))
    .filter(Boolean) as string[];

  const existingIps = leads
    .filter((l) => l.ip && l.createdAt >= ipSince)
    .map((l) => l.ip!)
    .filter(Boolean);

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
