import { AdminSupportTicketsPanel } from "@/components/support/admin-support-tickets-panel";
import { PageHero } from "@/components/admin/page-hero";

export default function AdminSupportPage() {
  return (
    <div className="space-y-7">
      <PageHero
        eyebrow="Help Center"
        title="Support Tickets"
        description="Review and respond to user support requests"
      />
      <AdminSupportTicketsPanel />
    </div>
  );
}
