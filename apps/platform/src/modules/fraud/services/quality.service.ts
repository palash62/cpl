import { prisma } from "@/lib/prisma";
import { notifyAdminAlert } from "@/services/notify.service";
import {
  computeCampaignRejectionRate,
  computePublisherQualityScore,
  computePublisherSpamScore,
} from "../repositories/quality.repo";

export async function refreshPublisherQuality(publisherId: string) {
  const [score, spamScore] = await Promise.all([
    computePublisherQualityScore(publisherId),
    computePublisherSpamScore(publisherId),
  ]);
  const profile = await prisma.publisherProfile.findUnique({
    where: { userId: publisherId },
    include: { user: { select: { name: true } } },
  });
  if (!profile) return { qualityScore: score, spamScore };

  const warning = score < 50 || (spamScore !== null && spamScore >= 51);
  await prisma.publisherProfile.update({
    where: { userId: publisherId },
    data: {
      qualityScore: score,
      spamScore,
      qualityWarningAt: warning ? new Date() : null,
      fraudFlags: warning ? { increment: 1 } : undefined,
    },
  });

  if (warning) {
    const reason =
      spamScore !== null && spamScore >= 51
        ? `spam score ${spamScore}%`
        : `quality score ${score}%`;
    void notifyAdminAlert({
      title: "Publisher quality warning",
      message: `${profile.user.name} flagged: ${reason} (30-day window).`,
      actionPath: "/admin/publishers",
      metadata: { publisherId, qualityScore: score, spamScore },
    });
  }

  return { qualityScore: score, spamScore };
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
