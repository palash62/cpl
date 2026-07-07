import { CreateCampaignForm } from "@/components/advertiser/create-campaign-form";
import { getPayoutTiersDisplay } from "@/lib/platform-settings-server";
import type { CampaignEditInitial } from "@/lib/campaign-form-edit";

export async function CreateCampaignPageContent({
  mode = "advertiser",
  initialOptinPageId,
  returnTo,
}: {
  mode?: "advertiser" | "admin";
  initialOptinPageId?: string;
  returnTo?: string;
}) {
  const payoutTiers = await getPayoutTiersDisplay();

  return (
    <div className="mx-auto max-w-7xl">
      <CreateCampaignForm
        mode={mode}
        payoutTiers={payoutTiers}
        initialOptinPageId={initialOptinPageId}
        returnTo={returnTo}
      />
    </div>
  );
}

export async function EditCampaignPageContent({
  campaign,
}: {
  campaign: CampaignEditInitial;
}) {
  const payoutTiers = await getPayoutTiersDisplay();

  return (
    <div className="mx-auto max-w-7xl">
      <CreateCampaignForm mode="admin" payoutTiers={payoutTiers} editCampaign={campaign} />
    </div>
  );
}
