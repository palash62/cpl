"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export function NotificationsPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/v1/notifications");
    const data = await res.json();
    setNotifications(data.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function markRead(id: string) {
    await fetch("/api/v1/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  async function markAllRead() {
    await fetch("/api/v1/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    load();
  }

  if (loading) return <p className="text-muted-foreground">Loading notifications...</p>;

  const unread = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{unread} unread</p>
        {unread > 0 && (
          <Button size="sm" variant="outline" onClick={markAllRead}>
            Mark all read
          </Button>
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start justify-between border-b py-3 last:border-0 ${!n.readAt ? "bg-primary/5 -mx-2 px-2 rounded" : ""}`}
            >
              <div>
                <p className="font-medium">{n.title}</p>
                <p className="text-sm text-muted-foreground">{n.body}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{n.type}</Badge>
                {!n.readAt && (
                  <Button size="sm" variant="ghost" onClick={() => markRead(n.id)}>
                    Mark read
                  </Button>
                )}
              </div>
            </div>
          ))}
          {notifications.length === 0 && <p className="text-muted-foreground">No notifications</p>}
        </CardContent>
      </Card>
    </div>
  );
}
