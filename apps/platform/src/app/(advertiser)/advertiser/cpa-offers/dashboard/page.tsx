import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { canAdvertiserAccessCpaOffers } from "@/lib/cpa-offers-access";
import { AdvertiserCpaOffersDashboard } from "@/components/advertiser/advertiser-cpa-offers-dashboard";

export const dynamic = "force-dynamic";

export default async function AdvertiserCpaOffersDashboardPage() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ADVERTISER") {
    redirect("/login");
  }

  if (!canAdvertiserAccessCpaOffers(session.user.email)) {
    redirect("/advertiser/cpa-offers");
  }

  return <AdvertiserCpaOffersDashboard />;
}

