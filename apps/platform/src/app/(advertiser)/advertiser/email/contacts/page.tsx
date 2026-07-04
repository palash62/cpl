import { RoleHero } from "@/components/layout/role-hero";
import { EmailContactsPanel } from "@/components/advertiser/email/email-contacts-panel";

export const dynamic = "force-dynamic";

export default function EmailContactsPage() {
  return (
    <div className="space-y-6">
      <RoleHero eyebrow="Email" title="Contacts" description="Leads synced automatically from your campaigns." />
      <EmailContactsPanel />
    </div>
  );
}
