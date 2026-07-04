import { RoleHero } from "@/components/layout/role-hero";
import { EmailTemplatesPanel } from "@/components/advertiser/email/email-templates-panel";

export const dynamic = "force-dynamic";

export default function EmailTemplatesPage() {
  return (
    <div className="space-y-6">
      <RoleHero eyebrow="Email" title="Templates" description="Create reusable emails with merge tags." />
      <EmailTemplatesPanel />
    </div>
  );
}
