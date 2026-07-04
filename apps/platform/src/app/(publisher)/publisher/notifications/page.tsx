import { Bell } from "lucide-react";
import { NotificationsPanel } from "@/components/notifications/notifications-panel";
import { RoleHero } from "@/components/layout/role-hero";
import { PublisherInfoBanner } from "@/components/publisher/publisher-info-banner";

export default function PublisherNotificationsPage() {
  return (
    <div className="space-y-6">
      <RoleHero
        eyebrow="Publisher Portal"
        title="Notifications"
        description="Stay updated on leads, payouts, and campaign activity."
        action={{ label: "View Leads", href: "/publisher/leads", icon: Bell }}
      />

      <PublisherInfoBanner>
        Notifications keep you informed about lead approvals, payout updates, and campaign changes.
        Mark items as read to keep your inbox organized.
      </PublisherInfoBanner>

      <NotificationsPanel />
    </div>
  );
}
