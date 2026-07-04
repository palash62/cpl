import { withAuth } from "@/lib/api-handler";
import { listNotifications, markNotificationRead } from "@/services/notification.service";

export async function GET(request: Request) {
  return withAuth(async (session) => {
    const unreadOnly = new URL(request.url).searchParams.get("unreadOnly") === "true";
    const notifications = await listNotifications(session.user.id, unreadOnly);
    return Response.json({ data: notifications });
  });
}

export async function PATCH(request: Request) {
  return withAuth(async (session) => {
    const body = await request.json();
    if (body.markAll) {
      const { prisma } = await import("@/lib/prisma");
      await prisma.notification.updateMany({
        where: { userId: session.user.id, readAt: null },
        data: { readAt: new Date() },
      });
      return Response.json({ success: true });
    }
    if (body.id) {
      await markNotificationRead(body.id, session.user.id);
    }
    return Response.json({ success: true });
  });
}
