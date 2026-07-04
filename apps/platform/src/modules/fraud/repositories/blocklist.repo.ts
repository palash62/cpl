import { prisma } from "@/lib/prisma";

export async function isIpBlocked(ip: string) {
  if (!ip) return false;
  const row = await prisma.ipBlocklist.findUnique({ where: { ip } });
  return Boolean(row);
}

export async function listBlocklist(page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.ipBlocklist.findMany({ orderBy: { createdAt: "desc" }, skip, take: limit }),
    prisma.ipBlocklist.count(),
  ]);
  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
}

export async function addBlocklistIp(ip: string, reason?: string) {
  return prisma.ipBlocklist.upsert({
    where: { ip },
    create: { ip, reason },
    update: { reason },
  });
}

export async function removeBlocklistIp(ip: string) {
  return prisma.ipBlocklist.deleteMany({ where: { ip } });
}
