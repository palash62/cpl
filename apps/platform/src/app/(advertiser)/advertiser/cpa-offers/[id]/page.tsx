import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AdvertiserCpaOfferDetail } from "@/components/advertiser/advertiser-cpa-offer-detail";

export const dynamic = "force-dynamic";

export default async function AdvertiserCpaOfferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ADVERTISER") {
    redirect("/login");
  }

  const { id } = await params;
  return <AdvertiserCpaOfferDetail offerId={id} />;
}
