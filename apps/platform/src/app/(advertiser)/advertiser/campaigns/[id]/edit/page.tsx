import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/session";
import { getCampaignById } from "@/services/campaign.service";
import { getPayoutTiersDisplay } from "@/lib/platform-settings-server";
import { CreateCampaignForm } from "@/components/advertiser/create-campaign-form";
import { ButtonLink } from "@/components/ui/button-link";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdvertiserCampaignEditPage({ params }: PageProps) {
  const [{ id }, session, payoutTiers] = await Promise.all([
    params,
    getSession(),
    getPayoutTiersDisplay(),
  ]);
  const campaign = await getCampaignById(id);

  if (!campaign || campaign.advertiserId !== session?.user.id) {
    notFound();
  }

  const leadCount = campaign._count?.leads ?? 0;

  return (
    <div className="space-y-6">
      <ButtonLink
        href={`/advertiser/campaigns/${campaign.id}`}
        variant="outline"
        size="sm"
        className="h-9 gap-1"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to campaign
      </ButtonLink>

      <div className="mx-auto max-w-7xl">
        <CreateCampaignForm
          mode="advertiser"
          payoutTiers={payoutTiers}
          editCampaign={{
            id: campaign.id,
            advertiserId: campaign.advertiserId,
            name: campaign.name,
            status: campaign.status,
            category: campaign.category,
            cpl: Number(campaign.cpl),
            budget: campaign.budget == null ? null : Number(campaign.budget),
            dailyCap: campaign.dailyCap,
            publisherAccess: campaign.publisherAccess,
            autoApprove: campaign.autoApprove,
            targeting: campaign.targeting,
            pixelToken: campaign.pixelToken,
            leadCount,
          }}
        />
      </div>
    </div>
  );
}
