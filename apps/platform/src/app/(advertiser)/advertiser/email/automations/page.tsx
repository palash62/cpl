import { RoleHero } from "@/components/layout/role-hero";
import { EmailAutomationsPanel } from "@/components/advertiser/email/email-automations-panel";

export const dynamic = "force-dynamic";

export default function EmailAutomationsPage() {
  return (
    <div className="space-y-6">
      <RoleHero eyebrow="Email" title="Automations" description="Drip sequences triggered by lead events." />
      <EmailAutomationsPanel />
    </div>
  );
}
