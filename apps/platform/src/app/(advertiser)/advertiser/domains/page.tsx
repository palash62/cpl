import { redirect } from "next/navigation";
import { RoleHero } from "@/components/layout/role-hero";
import { AdvertiserDomainsPanel } from "@/components/advertiser/domains/advertiser-domains-panel";
import { getSession } from "@/lib/session";
import { getPlatformHost } from "@/lib/platform-host";

export const dynamic = "force-dynamic";

export default async function AdvertiserDomainsPage() {
  const session = await getSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const platformHost = getPlatformHost();

  return (
    <div className="space-y-6">
      <RoleHero
        eyebrow="Advertiser Portal"
        title="Domains"
        description="Connect your own domain to serve published funnels at the root of your brand URL."
      />

      <AdvertiserDomainsPanel platformHost={platformHost} />
    </div>
  );
}
