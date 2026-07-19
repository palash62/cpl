import { requireAuth } from "@/lib/session";
import { AdvertiserGlobalPostbackForm } from "@/components/advertiser/advertiser-global-postback-form";

export default async function AdvertiserGlobalPostbackPage() {
  await requireAuth(["ADVERTISER"]);
  return <AdvertiserGlobalPostbackForm />;
}
