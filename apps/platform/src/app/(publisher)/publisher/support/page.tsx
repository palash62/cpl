import { MessageSquarePlus } from "lucide-react";
import { SupportTicketsPanel } from "@/components/support/support-tickets-panel";
import { RoleHero } from "@/components/layout/role-hero";
import { PublisherInfoBanner } from "@/components/publisher/publisher-info-banner";

export default function PublisherSupportPage() {
  return (
    <div className="space-y-7">
      <RoleHero
        eyebrow="Publisher Portal"
        title="Support"
        description="Get help with campaigns, payouts, and your publisher account."
        action={{ label: "New Ticket", href: "#new-ticket", icon: MessageSquarePlus }}
      />

      <PublisherInfoBanner>
        Submit a ticket below and track replies in the conversation thread. When support responds,
        you will see their message highlighted in the ticket details. Click a row to expand and reply.
      </PublisherInfoBanner>

      <SupportTicketsPanel />
    </div>
  );
}
