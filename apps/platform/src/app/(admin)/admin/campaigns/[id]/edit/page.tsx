import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCampaignById } from "@/services/campaign.service";
import { canAdminEditCampaign } from "@/lib/campaign-lifecycle";
import { EditCampaignPageContent } from "@/components/advertiser/create-campaign-page";
import { ButtonLink } from "@/components/ui/button-link";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminCampaignEditPage({ params }: PageProps) {
  const { id } = await params;
  const campaign = await getCampaignById(id);

  if (!campaign) {
    notFound();
  }

  const leadCount = campaign._count?.leads ?? 0;
  const lifecycle = { status: campaign.status, leadCount };

  if (!canAdminEditCampaign(lifecycle)) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <ButtonLink
        href={`/admin/campaigns/${campaign.id}`}
        variant="outline"
        size="sm"
        className="h-9 gap-1"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to campaign
      </ButtonLink>

      <EditCampaignPageContent
        campaign={{
          id: campaign.id,
          advertiserId: campaign.advertiserId,
          name: campaign.name,
          status: campaign.status,
          category: campaign.category,
          cpl: Number(campaign.cpl),
          budget: Number(campaign.budget),
          dailyCap: campaign.dailyCap,
          publisherAccess: campaign.publisherAccess,
          autoApprove: campaign.autoApprove,
          targeting: campaign.targeting,
          pixelToken: campaign.pixelToken,
          leadCount,
        }}
      />
    </div>
  );
}
