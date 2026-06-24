import { NotificationsPanel } from "@/components/notifications/notifications-panel";

export default function AdminNotificationsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Notifications</h2>
      <NotificationsPanel />
    </div>
  );
}
