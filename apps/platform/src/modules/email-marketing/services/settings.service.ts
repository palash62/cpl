import { prisma } from "@/lib/prisma";
import { PLATFORM_EMAILS } from "@/lib/email/addresses";

export async function getAdvertiserEmailSettings(advertiserId: string) {
  const [settings, user] = await Promise.all([
    prisma.advertiserEmailSettings.findUnique({ where: { advertiserId } }),
    prisma.user.findUnique({
      where: { id: advertiserId },
      include: { advertiserProfile: true },
    }),
  ]);

  return {
    fromName: settings?.fromName ?? user?.advertiserProfile?.company ?? user?.name ?? "",
    replyTo: settings?.replyTo ?? PLATFORM_EMAILS.support,
  };
}

export async function updateAdvertiserEmailSettings(
  advertiserId: string,
  data: { fromName?: string; replyTo?: string },
) {
  return prisma.advertiserEmailSettings.upsert({
    where: { advertiserId },
    create: {
      advertiserId,
      fromName: data.fromName,
      replyTo: data.replyTo,
    },
    update: {
      fromName: data.fromName,
      replyTo: data.replyTo,
    },
  });
}
