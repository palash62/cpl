import { prisma } from "@/lib/prisma";
import type { AutoresponderDeliveryStatus, AutoresponderTrigger } from "@prisma/client";

export async function findExistingDelivery(
  connectionId: string,
  leadId: string,
  event: AutoresponderTrigger,
) {
  return prisma.autoresponderDelivery.findUnique({
    where: {
      connectionId_leadId_event: { connectionId, leadId, event },
    },
  });
}

export async function createDelivery(data: {
  connectionId: string;
  leadId: string;
  event: AutoresponderTrigger;
  status: AutoresponderDeliveryStatus;
  attemptCount: number;
  httpStatus?: number;
  error?: string;
}) {
  return prisma.autoresponderDelivery.create({ data });
}

export async function updateDelivery(
  id: string,
  data: {
    status: AutoresponderDeliveryStatus;
    attemptCount: number;
    httpStatus?: number | null;
    error?: string | null;
  },
) {
  return prisma.autoresponderDelivery.update({ where: { id }, data });
}

export async function listDeliveries(connectionId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;
  const where = { connectionId };
  const [data, total] = await Promise.all([
    prisma.autoresponderDelivery.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        lead: { select: { id: true, status: true, data: true, createdAt: true } },
      },
    }),
    prisma.autoresponderDelivery.count({ where }),
  ]);
  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
}
