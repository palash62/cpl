export const dynamic = "force-dynamic";

import { LayoutTemplate } from "lucide-react";
import { getSession } from "@/lib/session";
import { listOptinFunnels } from "@/services/optin-funnel.service";
import { RoleHero } from "@/components/layout/role-hero";
import { OptinFunnelsGallery } from "@/components/advertiser/optin-funnels-gallery";

export default async function AdvertiserOptinFunnelsPage() {
  const session = await getSession();
  const funnels = await listOptinFunnels(session!.user.id);

  return (
    <div className="space-y-7">
      <RoleHero
        eyebrow="Advertiser Portal"
        title="Optin Funnel"
        description="Create optin funnels from beautiful templates or a blank canvas. Edit both optin and thank-you pages in one builder."
        action={{ label: "Create funnel", href: "#create", icon: LayoutTemplate }}
      />

      <OptinFunnelsGallery initialFunnels={funnels} />
    </div>
  );
}
