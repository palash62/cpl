import type { EmailEventType } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyTrackingToken } from "../lib/tokens";

export async function recordOpen(sendId: string, token: string) {
  if (!verifyTrackingToken(sendId, token)) return false;

  const send = await prisma.emailSend.findUnique({ where: { id: sendId } });
  if (!send) return false;

  const existing = await prisma.emailEvent.findFirst({
    where: { sendId, type: "OPEN" },
  });
  if (!existing) {
    await prisma.emailEvent.create({
      data: { sendId, type: "OPEN" },
    });
  }
  return true;
}

export async function recordClick(sendId: string, token: string, url: string) {
  if (!verifyTrackingToken(sendId, token)) return null;

  const send = await prisma.emailSend.findUnique({ where: { id: sendId } });
  if (!send) return null;

  await prisma.emailEvent.create({
    data: { sendId, type: "CLICK", metadata: { url } as Prisma.InputJsonValue },
  });

  return url;
}

export async function recordSesEvent(
  sendId: string | null,
  type: EmailEventType,
  metadata?: Record<string, unknown>,
) {
  if (!sendId) return;

  const send = await prisma.emailSend.findFirst({
    where: { sesMessageId: sendId },
  });
  if (!send) return;

  await prisma.emailEvent.create({
    data: { sendId: send.id, type, metadata: metadata as Prisma.InputJsonValue | undefined },
  });

  if (type === "BOUNCE") {
    await prisma.emailSend.update({
      where: { id: send.id },
      data: { status: "BOUNCED" },
    });
    await prisma.emailContact.update({
      where: { id: send.contactId },
      data: { status: "BOUNCED" },
    });
  }

  if (type === "COMPLAINT") {
    await prisma.emailContact.update({
      where: { id: send.contactId },
      data: { status: "COMPLAINED" },
    });
  }

  if (type === "DELIVERY") {
    await prisma.emailSend.update({
      where: { id: send.id },
      data: { status: "DELIVERED" },
    });
  }
}
