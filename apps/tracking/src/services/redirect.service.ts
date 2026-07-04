import { prisma } from "@cpl/database";
import { parsePlatformSettings, calculatePublisherPayout } from "@/lib/platform-settings";
import {
  campaignExcludesBlockedPublishers,
  filterCampaignsByCountry,
  pickCampaignForIpRotation,
  campaignQualifiesForSpecialPayouts,
  readPublisherSpecialTierPayouts,
} from "@/lib/redirect-helpers";
import type { Campaign, PublisherSmartLink } from "@prisma/client";

async function getPlatformSettings() {
  const rows = await prisma.platformSetting.findMany();
  const map = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  return parsePlatformSettings(map);
}

async function createTrackingLink(publisherId: string, campaignId: string) {
  const slug = `${publisherId.slice(-6)}-${campaignId.slice(-6)}-${Date.now().toString(36)}`;
  return prisma.trackingLink.create({
    data: { publisherId, campaignId, slug },
  });
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

async function getCampaignsShownToIp(publisherId: string, ip: string) {
  const clicks = await prisma.click.findMany({
    where: {
      ip,
      trackingLink: { publisherId },
    },
    select: { trackingLink: { select: { campaignId: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const row of clicks) {
    const campaignId = row.trackingLink.campaignId;
    if (!seen.has(campaignId)) {
      seen.add(campaignId);
      ordered.push(campaignId);
    }
  }
  return ordered;
}

async function resolveGlobalLinkFallback(publisherId: string) {
  const publisherProfile = await prisma.publisherProfile.findUnique({
    where: { userId: publisherId },
    select: { globalLinkUrl: true },
  });
  const publisherUrl = publisherProfile?.globalLinkUrl?.trim();
  if (publisherUrl) return publisherUrl;

  const settings = await getPlatformSettings();
  return settings.globalLinkUrl;
}

async function getEligibleCampaigns(publisherId: string, options?: { countryCode?: string }) {
  const [blockedAdvertisers, publisherProfile, platformSettings] = await Promise.all([
    prisma.advertiserPublisherBlock.findMany({
      where: { publisherId },
      select: { advertiserId: true },
    }),
    prisma.publisherProfile.findUnique({
      where: { userId: publisherId },
      select: {
        useSpecialTierPayouts: true,
        tier1SpecialPayout: true,
        tier2SpecialPayout: true,
        tier3SpecialPayout: true,
      },
    }),
    getPlatformSettings(),
  ]);

  const blockedAdvertiserIds = new Set(blockedAdvertisers.map((row) => row.advertiserId));
  const specialPayouts = readPublisherSpecialTierPayouts(publisherProfile);

  const campaigns = await prisma.campaign.findMany({
    where: { status: "ACTIVE" },
    include: {
      advertiser: { select: { id: true, name: true, email: true } },
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
    if (specialPayouts.enabled) {
      const cpl = Number(campaign.cpl);
      const qualifies = campaignQualifiesForSpecialPayouts(
        (_tier, sampleCountry) =>
          calculatePublisherPayout(cpl, sampleCountry, platformSettings).publisherAmount,
        specialPayouts,
        options?.countryCode ?? null,
      );
      if (!qualifies) return false;
    }
    return true;
  });
}

export async function pickNextCampaign(
  publisherId: string,
  options: { ip: string; countryCode?: string },
) {
  const smartLink = await prisma.publisherSmartLink.findUnique({ where: { publisherId } });
  if (!smartLink) {
    return {
      smartLink: null as PublisherSmartLink | null,
      trackingSlug: null,
      globalLinkUrl: await resolveGlobalLinkFallback(publisherId),
    };
  }

  const eligible = await getEligibleCampaigns(publisherId, { countryCode: options.countryCode });
  const countryEligible = filterCampaignsByCountry(eligible, options.countryCode);

  if (countryEligible.length === 0) {
    return {
      smartLink,
      trackingSlug: null,
      globalLinkUrl: await resolveGlobalLinkFallback(publisherId),
    };
  }

  const shownCampaignIds = await getCampaignsShownToIp(publisherId, options.ip);
  const campaign = pickCampaignForIpRotation(
    countryEligible,
    shownCampaignIds,
    smartLink.rotationCursor,
  );

  if (!campaign) {
    return {
      smartLink,
      trackingSlug: null,
      globalLinkUrl: await resolveGlobalLinkFallback(publisherId),
    };
  }

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
    trackingSlug: trackingLink.slug,
    globalLinkUrl: null,
  };
}

export { createTrackingLink };
