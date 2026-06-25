import { SupportTicketsPanel } from "@/components/support/support-tickets-panel";
import { PageHeader } from "@/components/layout/page-header";

export default function AdvertiserSupportPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Support" description="Get help with your campaigns and account" />
      <SupportTicketsPanel />
    </div>
  );
}
