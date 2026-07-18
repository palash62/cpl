import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AdvertiserCpaOffersMarketplace } from "@/components/advertiser/advertiser-cpa-offers-marketplace";

export const dynamic = "force-dynamic";

export default async function AdvertiserCpaOffersPage() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ADVERTISER") {
    redirect("/login");
  }

  return <AdvertiserCpaOffersMarketplace />;
}
