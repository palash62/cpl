import { prisma } from "@cpl/database";

export async function logClick(
  slug: string,
  meta: {
    ip: string;
    userAgent?: string;
    referrer?: string;
    geo?: Record<string, string>;
    source?: string;
    subId?: string;
  },
) {
  const link = await prisma.trackingLink.findUnique({ where: { slug } });
  if (!link) return null;

  await prisma.$transaction([
    prisma.click.create({
      data: {
        trackingLinkId: link.id,
        ip: meta.ip,
        userAgent: meta.userAgent,
        referrer: meta.referrer,
        geo: meta.geo,
        source: meta.source,
        subId: meta.subId,
      },
    }),
    prisma.trackingLink.update({
      where: { id: link.id },
      data: { clickCount: { increment: 1 } },
    }),
  ]);

  return link;
}
