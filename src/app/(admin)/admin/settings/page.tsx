import { PlatformSettingsForm } from "@/components/forms/platform-settings-form";
import { PageHero } from "@/components/admin/page-hero";
import { PageSection } from "@/components/admin/page-section";
import { Settings } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-7">
      <PageHero
        eyebrow="Configuration"
        title="Platform Settings"
        description="Configure global platform options and defaults"
      />
      <PageSection
        title="Payout & Smart Link Fallback"
        description="Publisher earnings, tier ranges, and global campaign routing"
        icon={Settings}
        gradient="revenue"
      >
        <div className="p-6">
          <PlatformSettingsForm />
        </div>
      </PageSection>
    </div>
  );
}
