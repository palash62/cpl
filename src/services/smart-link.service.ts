import { campaignExcludesBlockedPublishers } from "@/lib/campaign-targeting";
import { prisma } from "@/lib/prisma";
import { notifyGeneric, notifyUserById } from "@/services/notify.service";
import { createTrackingLink } from "@/services/campaign.service";
import type { Campaign, PublisherSmartLink, User } from "@prisma/client";

export type EligibleCampaign = Campaign & {
  advertiser: Pick<User, "id" | "name" | "email">;
};

export async function getOrCreatePublisherSmartLink(publisherId: string): Promise<PublisherSmartLink> {
  const existing = await prisma.publisherSmartLink.findUnique({
    where: { publisherId },
  });
  if (existing) return existing;

  const slug = `pub-${publisherId.slice(-10)}-${Date.now().toString(36)}`;
  return prisma.publisherSmartLink.create({
    data: { publisherId, slug },
  });
}

export async function getEligibleCampaigns(publisherId: string): Promise<EligibleCampaign[]> {
  const blockedAdvertisers = await prisma.advertiserPublisherBlock.findMany({
    where: { publisherId },
    select: { advertiserId: true },
  });
  const blockedAdvertiserIds = new Set(blockedAdvertisers.map((row) => row.advertiserId));

  const campaigns = await prisma.campaign.findMany({
    where: {
      status: "ACTIVE",
    },
    include: {
      advertiser: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return campaigns.filter((campaign) => {
    if (Number(campaign.spent) >= Number(campaign.budget)) return false;

    if (
      campaignExcludesBlockedPublishers(campaign.targeting) &&
      blockedAdvertiserIds.has(campaign.advertiserId)
    ) {
      return false;
    }

    return true;
  });
}

export async function ensureTrackingLink(publisherId: string, campaignId: string) {
  const existing = await prisma.trackingLink.findFirst({
    where: { publisherId, campaignId },
    orderBy: { createdAt: "desc" },
  });
  if (existing) return existing;
  return createTrackingLink(publisherId, campaignId);
}

export async function pickNextCampaign(publisherId: string) {
  const smartLink = await getOrCreatePublisherSmartLink(publisherId);
  const eligible = await getEligibleCampaigns(publisherId);

  if (eligible.length === 0) {
    const { getPlatformSettings } = await import("@/services/wallet.service");
    const settings = await getPlatformSettings();
    return {
      smartLink,
      eligible: [],
      campaign: null,
      trackingSlug: null,
      globalLinkUrl: settings.globalLinkUrl,
    };
  }

  const index = smartLink.rotationCursor % eligible.length;
  const campaign = eligible[index]!;

  const [updatedSmartLink, trackingLink] = await prisma.$transaction(async (tx) => {
    const updated = await tx.publisherSmartLink.update({
      where: { id: smartLink.id },
      data: { rotationCursor: { increment: 1 } },
    });

    const existing = await tx.trackingLink.findFirst({
      where: { publisherId, campaignId: campaign.id },
      orderBy: { createdAt: "desc" },
    });

    const link =
      existing ??
      (await tx.trackingLink.create({
        data: {
          publisherId,
          campaignId: campaign.id,
          slug: `${publisherId.slice(-6)}-${campaign.id.slice(-6)}-${Date.now().toString(36)}`,
        },
      }));

    return [updated, link] as const;
  });

  return {
    smartLink: updatedSmartLink,
    eligible,
    campaign,
    trackingSlug: trackingLink.slug,
    globalLinkUrl: null,
  };
}

export async function resolveSmartLinkBySlug(slug: string) {
  return prisma.publisherSmartLink.findUnique({
    where: { slug },
    include: {
      publisher: {
        select: { id: true, name: true, status: true, role: true },
      },
    },
  });
}

export async function getPublisherSmartLinkDashboard(publisherId: string) {
  const smartLink = await getOrCreatePublisherSmartLink(publisherId);
  const eligible = await getEligibleCampaigns(publisherId);

  const [leadStats, clickStats] = await Promise.all([
    prisma.lead.groupBy({
      by: ["source"],
      where: { publisherId, source: { not: null } },
      _count: { id: true },
    }),
    prisma.click.groupBy({
      by: ["source"],
      where: {
        source: { not: null },
        trackingLink: { publisherId },
      },
      _count: { id: true },
    }),
  ]);

  const sourceMap = new Map<string, { leads: number; clicks: number }>();

  for (const row of leadStats) {
    const key = row.source ?? "unknown";
    sourceMap.set(key, { leads: row._count.id, clicks: 0 });
  }
  for (const row of clickStats) {
    const key = row.source ?? "unknown";
    const existing = sourceMap.get(key) ?? { leads: 0, clicks: 0 };
    existing.clicks = row._count.id;
    sourceMap.set(key, existing);
  }

  const sourceBreakdown = Array.from(sourceMap.entries())
    .map(([source, stats]) => ({ source, ...stats }))
    .sort((a, b) => b.leads - a.leads);

  return { smartLink, eligible, sourceBreakdown };
}

export async function blockPublisher(
  advertiserId: string,
  publisherId: string,
  reason?: string,
) {
  const [block, publisher] = await Promise.all([
    prisma.advertiserPublisherBlock.upsert({
      where: {
        advertiserId_publisherId: { advertiserId, publisherId },
      },
      create: { advertiserId, publisherId, reason },
      update: { reason },
    }),
    prisma.user.findUnique({
      where: { id: publisherId },
      select: { id: true, email: true, name: true },
    }),
  ]);

  if (publisher) {
    void notifyGeneric(publisher, {
      title: "Access restricted",
      message: reason?.trim()
        ? `An advertiser has blocked you from their campaigns. Reason: ${reason.trim()}`
        : "An advertiser has blocked you from their campaigns.",
      actionPath: "/publisher/marketplace",
      notificationType: "publisher.blocked",
    });
  }

  return block;
}

export async function unblockPublisher(advertiserId: string, publisherId: string) {
  const result = await prisma.advertiserPublisherBlock.deleteMany({
    where: { advertiserId, publisherId },
  });

  if (result.count > 0) {
    void notifyUserById(publisherId, {
      title: "Access restored",
      message: "An advertiser has unblocked you. You may join their campaigns again.",
      actionPath: "/publisher/marketplace",
      notificationType: "publisher.unblocked",
    });
  }

  return result;
}

export async function listBlockedPublishers(advertiserId: string) {
  return prisma.advertiserPublisherBlock.findMany({
    where: { advertiserId },
    include: {
      publisher: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function isPublisherBlocked(advertiserId: string, publisherId: string) {
  const block = await prisma.advertiserPublisherBlock.findUnique({
    where: {
      advertiserId_publisherId: { advertiserId, publisherId },
    },
  });
  return Boolean(block);
}
