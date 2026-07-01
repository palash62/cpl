import { RoleHero } from "@/components/layout/role-hero";
import { EmailActivityPanel } from "@/components/advertiser/email/email-activity-panel";

export const dynamic = "force-dynamic";

export default function EmailActivityPage() {
  return (
    <div className="space-y-6">
      <RoleHero eyebrow="Email" title="Activity" description="Send log with opens and clicks." />
      <EmailActivityPanel />
    </div>
  );
}
