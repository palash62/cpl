import { SupportTicketsPanel } from "@/components/support/support-tickets-panel";
import { PageHeader } from "@/components/layout/page-header";

export default function PublisherSupportPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Support" description="Get help with campaigns, payouts, and your account" />
      <SupportTicketsPanel />
    </div>
  );
}
