import { SupportTicketsPanel } from "@/components/support/support-tickets-panel";

export default function AdminSupportPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Support Tickets</h2>
      <SupportTicketsPanel isAdmin />
    </div>
  );
}
