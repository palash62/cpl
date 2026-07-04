export const dynamic = "force-dynamic";

import { LayoutTemplate } from "lucide-react";
import { getSession } from "@/lib/session";
import { RoleHero } from "@/components/layout/role-hero";
import { LandingPagesGallery } from "@/components/advertiser/landing-pages-gallery";

export default async function AdvertiserLandingPagesPage() {
  await getSession();

  return (
    <div className="space-y-7">
      <RoleHero
        eyebrow="Advertiser Portal"
        title="Landing Pages"
        description="Build high-converting pages with drag-and-drop. Runs alongside your simple Opt-in Pages."
        action={{ label: "Opt-in Pages", href: "/advertiser/optin-pages", icon: LayoutTemplate }}
      />
      <LandingPagesGallery />
    </div>
  );
}
