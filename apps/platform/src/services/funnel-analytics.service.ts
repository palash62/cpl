import { prisma } from "@/lib/prisma";
import type { FunnelEventType } from "@prisma/client";

export async function recordFunnelEvent(input: {
  funnelId: string;
  campaignId: string;
  eventType: FunnelEventType;
  step?: string;
  leadId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}) {
  const event = await prisma.funnelEvent.create({
    data: {
      funnelId: input.funnelId,
      campaignId: input.campaignId,
      eventType: input.eventType,
      step: input.step ?? "optin",
      leadId: input.leadId,
      ip: input.ip,
      userAgent: input.userAgent,
      metadata: input.metadata ? (input.metadata as object) : undefined,
    },
  });

  if (input.eventType === "CTA_CLICK" && input.leadId) {
    await prisma.lead.updateMany({
      where: { id: input.leadId, ctaClicked: false },
      data: { ctaClicked: true },
    });
  }

  return event;
}

export async function getFunnelAnalyticsSummary(funnelId: string) {
  const [views, submits, thankYouViews, pixelFires] = await Promise.all([
    prisma.funnelEvent.count({ where: { funnelId, eventType: "VIEW" } }),
    prisma.funnelEvent.count({ where: { funnelId, eventType: "SUBMIT" } }),
    prisma.funnelEvent.count({ where: { funnelId, eventType: "THANK_YOU_VIEW" } }),
    prisma.funnelEvent.count({ where: { funnelId, eventType: "PIXEL_FIRE" } }),
  ]);

  return {
    views,
    submits,
    thankYouViews,
    pixelFires,
    submitRate: views > 0 ? (submits / views) * 100 : 0,
    thankYouRate: submits > 0 ? (thankYouViews / submits) * 100 : 0,
    pixelRate: thankYouViews > 0 ? (pixelFires / thankYouViews) * 100 : 0,
  };
}
