import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AdvertiserGlobalPostbackForm } from "@/components/advertiser/advertiser-global-postback-form";

export const dynamic = "force-dynamic";

export default async function AdvertiserGlobalPostbackPage() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ADVERTISER") {
    redirect("/login");
  }
  return <AdvertiserGlobalPostbackForm />;
}
