import { NotificationsPanel } from "@/components/notifications/notifications-panel";
import { PageHero } from "@/components/admin/page-hero";

export default function AdminNotificationsPage() {
  return (
    <div className="space-y-7">
      <PageHero
        eyebrow="Alerts"
        title="Notifications"
        description="Platform alerts and system notifications"
      />
      <NotificationsPanel />
    </div>
  );
}
