import { SupportTicketsPanel } from "@/components/support/support-tickets-panel";

export default function PublisherSupportPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Support</h2>
      <SupportTicketsPanel />
    </div>
  );
}
