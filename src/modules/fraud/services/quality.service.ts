import { prisma } from "@/lib/prisma";
import { notifyAdminAlert } from "@/services/notify.service";
import {
  computeCampaignRejectionRate,
  computePublisherQualityScore,
} from "../repositories/quality.repo";

export async function refreshPublisherQuality(publisherId: string) {
  const score = await computePublisherQualityScore(publisherId);
  const profile = await prisma.publisherProfile.findUnique({
    where: { userId: publisherId },
    include: { user: { select: { name: true } } },
  });
  if (!profile) return score;

  const warning = score < 50;
  await prisma.publisherProfile.update({
    where: { userId: publisherId },
    data: {
      qualityScore: score,
      qualityWarningAt: warning ? new Date() : null,
      fraudFlags: warning ? { increment: 1 } : undefined,
    },
  });

  if (warning) {
    void notifyAdminAlert({
      title: "Publisher quality warning",
      message: `${profile.user.name} quality score dropped to ${score}% (30-day window).`,
      actionPath: "/admin/fraud",
      metadata: { publisherId, qualityScore: score },
    });
  }

  return score;
}

export async function checkCampaignQualityAlert(campaignId: string, campaignName: string) {
  const rate = await computeCampaignRejectionRate(campaignId);
  if (rate === null || rate < 0.8) return;

  void notifyAdminAlert({
    title: "Campaign quality alert",
    message: `Campaign "${campaignName}" has ${Math.round(rate * 100)}% rejection rate in recent leads.`,
    actionPath: "/admin/campaigns",
    metadata: { campaignId, rejectionRate: rate },
  });
}
