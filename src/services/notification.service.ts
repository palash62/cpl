import { prisma } from "@/lib/prisma";
import type { TicketCategory } from "@prisma/client";

const TICKET_CATEGORIES: TicketCategory[] = [
  "GENERAL",
  "BILLING",
  "TECHNICAL",
  "CAMPAIGN",
  "PAYOUT",
  "OTHER",
];

function normalizeTicketCategory(category: TicketCategory | string): TicketCategory {
  const normalized = String(category).trim().toUpperCase() as TicketCategory;
  return TICKET_CATEGORIES.includes(normalized) ? normalized : "OTHER";
}

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
  category: TicketCategory | string,
  body: string,
) {
  const ticketCategory = normalizeTicketCategory(category);

  return prisma.supportTicket.create({
    data: {
      userId,
      subject: subject.trim(),
      category: ticketCategory,
      messages: {
        create: { senderId: userId, body: body.trim() },
      },
    },
    include: { messages: true },
  });
}

export async function listTickets(filters: {
  userId?: string;
  status?: string;
  page?: number;
  hideInternal?: boolean;
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
      messages: {
        where: filters.hideInternal ? { isInternal: false } : undefined,
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { name: true, role: true } } },
      },
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
  const sender = await prisma.user.findUnique({
    where: { id: senderId },
    select: { role: true },
  });

  await prisma.ticketMessage.create({
    data: { ticketId, senderId, body: body.trim(), isInternal },
  });

  const statusUpdate =
    sender?.role === "ADMIN" && !isInternal
      ? { status: "IN_PROGRESS" as const }
      : {};

  return prisma.supportTicket.update({
    where: { id: ticketId },
    data: { updatedAt: new Date(), ...statusUpdate },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { name: true, role: true } } },
      },
      user: { select: { name: true, email: true, role: true } },
    },
  });
}

export async function getTicketForUser(ticketId: string, userId: string, isAdmin: boolean) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    select: { id: true, userId: true },
  });

  if (!ticket) return null;
  if (!isAdmin && ticket.userId !== userId) return null;
  return ticket;
}
