export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { listOptinFunnels } from "@/services/optin-funnel.service";
import { FunnelListPanel } from "@/components/advertiser/funnel/funnel-list-panel";

export default async function AdvertiserOptinFunnelsPage() {
  const session = await getSession();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const funnels = await listOptinFunnels(session.user.id);

  return <FunnelListPanel initialFunnels={funnels} />;
}
