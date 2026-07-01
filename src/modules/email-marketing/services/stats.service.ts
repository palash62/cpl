import { prisma } from "@/lib/prisma";

export async function getEmailStats(advertiserId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalSends, sentToday, activeAutomations, totalContacts, opens, clicks, delivered] =
    await Promise.all([
      prisma.emailSend.count({ where: { advertiserId } }),
      prisma.emailSend.count({
        where: { advertiserId, sentAt: { gte: today } },
      }),
      prisma.emailAutomation.count({
        where: { advertiserId, status: "ACTIVE" },
      }),
      prisma.emailContact.count({
        where: { advertiserId, status: "SUBSCRIBED" },
      }),
      prisma.emailEvent.count({
        where: { type: "OPEN", send: { advertiserId } },
      }),
      prisma.emailEvent.count({
        where: { type: "CLICK", send: { advertiserId } },
      }),
      prisma.emailSend.count({
        where: { advertiserId, status: { in: ["SENT", "DELIVERED"] } },
      }),
    ]);

  const openRate = delivered > 0 ? Math.round((opens / delivered) * 100) : 0;
  const clickRate = delivered > 0 ? Math.round((clicks / delivered) * 100) : 0;

  return {
    totalSends,
    sentToday,
    activeAutomations,
    totalContacts,
    opens,
    clicks,
    delivered,
    openRate,
    clickRate,
  };
}

export async function listSends(
  advertiserId: string,
  opts: { page: number; limit: number; status?: string },
) {
  const where = {
    advertiserId,
    ...(opts.status ? { status: opts.status as never } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.emailSend.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (opts.page - 1) * opts.limit,
      take: opts.limit,
      include: {
        contact: { select: { email: true, firstName: true, lastName: true } },
        automation: { select: { name: true } },
        template: { select: { subject: true } },
        events: { select: { type: true } },
      },
    }),
    prisma.emailSend.count({ where }),
  ]);

  return {
    items: items.map((s) => ({
      ...s,
      hasOpen: s.events.some((e) => e.type === "OPEN"),
      hasClick: s.events.some((e) => e.type === "CLICK"),
      events: undefined,
    })),
    total,
    page: opts.page,
    limit: opts.limit,
  };
}

export async function getAutomationStepStats(advertiserId: string, automationId: string) {
  const automation = await prisma.emailAutomation.findFirst({
    where: { id: automationId, advertiserId },
    include: { steps: { orderBy: { order: "asc" } } },
  });
  if (!automation) return null;

  const stepStats = await Promise.all(
    automation.steps.map(async (step) => {
      const [sent, opens, clicks] = await Promise.all([
        prisma.emailSend.count({
          where: { stepId: step.id, status: { in: ["SENT", "DELIVERED"] } },
        }),
        prisma.emailEvent.count({
          where: { type: "OPEN", send: { stepId: step.id } },
        }),
        prisma.emailEvent.count({
          where: { type: "CLICK", send: { stepId: step.id } },
        }),
      ]);
      return {
        stepId: step.id,
        order: step.order,
        delayMinutes: step.delayMinutes,
        sent,
        opens,
        clicks,
        openRate: sent > 0 ? Math.round((opens / sent) * 100) : 0,
        clickRate: sent > 0 ? Math.round((clicks / sent) * 100) : 0,
      };
    }),
  );

  return { automationId, steps: stepStats };
}
