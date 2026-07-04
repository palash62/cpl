export const dynamic = "force-dynamic";

import { getSession } from "@/lib/session";
import { getPublisherSmartLinkDashboard } from "@/services/smart-link.service";
import { RoleHero } from "@/components/layout/role-hero";
import { PublisherInfoBanner } from "@/components/publisher/publisher-info-banner";
import { PublisherSmartLinkPanel } from "@/components/publisher/publisher-smart-link-panel";

export default async function PublisherSmartLinkPage() {
  const session = await getSession();
  const { smartLink, eligible, sourceBreakdown, globalLinkUrl, platformGlobalLinkUrl } =
    await getPublisherSmartLinkDashboard(session!.user.id);

  const eligibleCampaigns = eligible.map((campaign) => ({
    id: campaign.id,
    name: campaign.name,
    cpl: Number(campaign.cpl),
    advertiser: { name: campaign.advertiser.name },
  }));

  return (
    <div className="space-y-6">
      <RoleHero
        eyebrow="Publisher Portal"
        title="Smart Link"
        description="One link that rotates across all active campaigns. Track leads by platform."
      />

      <PublisherInfoBanner>
        Copy your Smart Link and share it on Facebook, Instagram, TikTok, or any channel. Use
        platform links to see which source drives the most leads.
      </PublisherInfoBanner>

      <PublisherSmartLinkPanel
        slug={smartLink.slug}
        eligible={eligibleCampaigns}
        sourceBreakdown={sourceBreakdown}
        globalLinkUrl={globalLinkUrl}
        platformGlobalLinkUrl={platformGlobalLinkUrl}
      />
    </div>
  );
}
