import { NotificationsPanel } from "@/components/notifications/notifications-panel";
import { PageHeader } from "@/components/layout/page-header";

export default function AdvertiserNotificationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" description="Stay updated on leads and campaign activity" />
      <NotificationsPanel />
    </div>
  );
}
