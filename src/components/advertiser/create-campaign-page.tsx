import { CreateCampaignForm } from "@/components/advertiser/create-campaign-form";
import { getPayoutTiersDisplay } from "@/lib/platform-settings-server";

export async function CreateCampaignPageContent({
  mode = "advertiser",
}: {
  mode?: "advertiser" | "admin";
}) {
  const payoutTiers = await getPayoutTiersDisplay();

  return (
    <div className="mx-auto max-w-7xl">
      <CreateCampaignForm mode={mode} payoutTiers={payoutTiers} />
    </div>
  );
}
