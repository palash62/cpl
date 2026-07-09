import { PlatformSettingsForm } from "@/components/forms/platform-settings-form";
import { SmtpSettingsForm } from "@/components/forms/smtp-settings-form";
import { SesSettingsForm } from "@/components/forms/ses-settings-form";
import { StripeSettingsForm } from "@/components/forms/stripe-settings-form";
import { EmailLogsTable } from "@/components/admin/email-logs-table";
import { PageHero } from "@/components/admin/page-hero";
import { PageSection } from "@/components/admin/page-section";
import { Mail, Settings, Cloud, CreditCard } from "lucide-react";

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
      <PageSection
        title="Payments (Stripe)"
        description="Credit card checkout for advertiser wallet top-ups"
        icon={CreditCard}
        gradient="revenue"
      >
        <div className="p-6">
          <StripeSettingsForm />
        </div>
      </PageSection>
      <PageSection
        title="Email Marketing (AWS SES)"
        description="Configure SES for advertiser autoresponder and drip campaigns"
        icon={Cloud}
        gradient="leads"
      >
        <div className="p-6">
          <SesSettingsForm />
        </div>
      </PageSection>
      <PageSection
        title="Email (SMTP)"
        description="Configure outbound mail, test delivery, and review recent messages"
        icon={Mail}
        gradient="leads"
      >
        <div className="space-y-8 p-6">
          <SmtpSettingsForm />
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">Recent email log</h3>
            <EmailLogsTable />
          </div>
        </div>
      </PageSection>
    </div>
  );
}
