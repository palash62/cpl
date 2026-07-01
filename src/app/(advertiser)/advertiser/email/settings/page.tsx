import { RoleHero } from "@/components/layout/role-hero";
import { EmailSettingsPanel } from "@/components/advertiser/email/email-settings-panel";

export const dynamic = "force-dynamic";

export default function EmailSettingsPage() {
  return (
    <div className="space-y-6">
      <RoleHero eyebrow="Email" title="Settings" description="Sender name, reply-to, and custom domain verification." />
      <EmailSettingsPanel />
    </div>
  );
}
