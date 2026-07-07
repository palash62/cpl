import { CreateCampaignPageContent } from "@/components/advertiser/create-campaign-page";

export const dynamic = "force-dynamic";

export default async function CreateCampaignPage({
  searchParams,
}: {
  searchParams: Promise<{ optinPageId?: string; returnTo?: string }>;
}) {
  const params = await searchParams;
  return (
    <CreateCampaignPageContent
      initialOptinPageId={params.optinPageId}
      returnTo={params.returnTo}
    />
  );
}
