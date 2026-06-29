export const dynamic = "force-dynamic";

import { LayoutTemplate, Plus } from "lucide-react";
import { PageSection } from "@/components/admin/page-section";
import { RoleHero } from "@/components/layout/role-hero";

export default function AdvertiserOptinPagesPage() {
  return (
    <div className="space-y-7">
      <RoleHero
        eyebrow="Advertiser Portal"
        title="Optin Pages"
        description="Create and manage landing pages for your campaigns."
        action={{ label: "New Page", href: "#", icon: Plus }}
      />

      <PageSection
        title="Your Optin Pages"
        description="Landing pages connected to your campaigns"
        icon={LayoutTemplate}
        gradient="revenue"
      >
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div
            className="mb-4 flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: "var(--theme-primary-soft)" }}
          >
            <LayoutTemplate className="h-7 w-7 text-[var(--theme-primary)]" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">No optin pages yet</h3>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Create your first optin page to capture leads for your campaigns.
          </p>
        </div>
      </PageSection>
    </div>
  );
}
