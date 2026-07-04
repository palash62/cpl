import { prisma } from "@/lib/prisma";
import type { AutoresponderTrigger, AdvertiserAutoresponder } from "@prisma/client";

export async function listConnectionsByAdvertiser(advertiserId: string) {
  return prisma.advertiserAutoresponder.findMany({
    where: { advertiserId },
    orderBy: { createdAt: "desc" },
  });
}

export async function countConnectionsByAdvertiser(advertiserId: string) {
  return prisma.advertiserAutoresponder.count({ where: { advertiserId } });
}

export async function getConnectionById(id: string, advertiserId?: string) {
  return prisma.advertiserAutoresponder.findFirst({
    where: { id, ...(advertiserId ? { advertiserId } : {}) },
  });
}

export async function createConnection(data: {
  advertiserId: string;
  name: string;
  provider: AdvertiserAutoresponder["provider"];
  trigger: AutoresponderTrigger;
  campaignId?: string | null;
  isEnabled?: boolean;
  config: object;
  fieldMapping?: object | null;
}) {
  return prisma.advertiserAutoresponder.create({ data: data as never });
}

export async function updateConnection(
  id: string,
  advertiserId: string,
  data: Partial<{
    name: string;
    trigger: AutoresponderTrigger;
    campaignId: string | null;
    isEnabled: boolean;
    config: object;
    fieldMapping: object | null;
  }>,
) {
  return prisma.advertiserAutoresponder.updateMany({
    where: { id, advertiserId },
    data: data as never,
  });
}

export async function deleteConnection(id: string, advertiserId: string) {
  return prisma.advertiserAutoresponder.deleteMany({
    where: { id, advertiserId },
  });
}

export async function listMatchingConnections(
  advertiserId: string,
  event: AutoresponderTrigger,
  campaignId: string,
) {
  return prisma.advertiserAutoresponder.findMany({
    where: {
      advertiserId,
      isEnabled: true,
      trigger: event,
      OR: [{ campaignId: null }, { campaignId }],
    },
  });
}
