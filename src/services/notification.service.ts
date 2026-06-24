import { prisma } from "@/lib/prisma";
import type { TicketCategory } from "@prisma/client";

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  body: string,
) {
  return prisma.notification.create({
    data: { userId, type, title, body },
  });
}

export async function listNotifications(userId: string, unreadOnly = false) {
  return prisma.notification.findMany({
    where: {
      userId,
      ...(unreadOnly && { readAt: null }),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function markNotificationRead(id: string, userId: string) {
  return prisma.notification.updateMany({
    where: { id, userId },
    data: { readAt: new Date() },
  });
}

export async function createTicket(
  userId: string,
  subject: string,
  category: TicketCategory,
  body: string,
) {
  return prisma.supportTicket.create({
    data: {
      userId,
      subject,
      category,
      messages: {
        create: { senderId: userId, body },
      },
    },
    include: { messages: true },
  });
}

export async function listTickets(filters: {
  userId?: string;
  status?: string;
  page?: number;
}) {
  const page = filters.page ?? 1;
  const where = {
    ...(filters.userId && { userId: filters.userId }),
    ...(filters.status && { status: filters.status as never }),
  };

  return prisma.supportTicket.findMany({
    where,
    include: {
      user: { select: { name: true, email: true, role: true } },
      messages: { take: 1, orderBy: { createdAt: "desc" } },
    },
    orderBy: { updatedAt: "desc" },
    skip: (page - 1) * 20,
    take: 20,
  });
}

export async function addTicketMessage(
  ticketId: string,
  senderId: string,
  body: string,
  isInternal = false,
) {
  await prisma.ticketMessage.create({
    data: { ticketId, senderId, body, isInternal },
  });

  return prisma.supportTicket.update({
    where: { id: ticketId },
    data: { updatedAt: new Date() },
    include: { messages: { include: { sender: { select: { name: true } } } } },
  });
}
