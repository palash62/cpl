export const dynamic = "force-dynamic";

import { LayoutTemplate } from "lucide-react";
import { getSession } from "@/lib/session";
import { getAdvertiserOptinPageState } from "@/services/optin-page.service";
import { RoleHero } from "@/components/layout/role-hero";
import { OptinTemplateGallery } from "@/components/advertiser/optin-template-gallery";
import { OptinPageStatusBadges } from "@/components/advertiser/optin-page-status-badges";

export default async function AdvertiserOptinPagesPage() {
  const session = await getSession();
  const page = await getAdvertiserOptinPageState(session!.user.id);

  return (
    <div className="space-y-7">
      <RoleHero
        eyebrow="Advertiser Portal"
        title="Optin Pages"
        description="Choose from six high-converting templates, then customize your page."
        action={
          page
            ? { label: "Edit current page", href: "/advertiser/optin-pages/edit", icon: LayoutTemplate }
            : undefined
        }
      />

      {page && <OptinPageStatusBadges initialPage={page} />}

      <OptinTemplateGallery currentPage={page} />
    </div>
  );
}
