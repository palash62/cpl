import { RoleHero } from "@/components/layout/role-hero";
import { EmailDashboardPanel } from "@/components/advertiser/email/email-dashboard-panel";

export const dynamic = "force-dynamic";

export default function AdvertiserEmailPage() {
  return (
    <div className="space-y-6">
      <RoleHero
        eyebrow="Advertiser Portal"
        title="Email Marketing"
        description="Send welcome emails and drip sequences to leads — no third-party ESP required."
      />
      <EmailDashboardPanel />
    </div>
  );
}
