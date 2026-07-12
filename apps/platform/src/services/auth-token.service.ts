import crypto from "crypto";
import type { UserRole, UserStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  notifyAccountActivated,
  notifyAdminAlert,
} from "@/services/notify.service";

function createToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function createPasswordResetToken(userId: string) {
  const token = createToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  });

  await prisma.passwordResetToken.create({
    data: { userId, token, expiresAt },
  });

  return token;
}

export async function consumePasswordResetToken(token: string) {
  const record = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: { select: { id: true, email: true, name: true } } },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return null;
  }

  await prisma.passwordResetToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  return record.user;
}

export async function createEmailVerificationToken(userId: string) {
  const token = createToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.emailVerificationToken.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  });

  await prisma.emailVerificationToken.create({
    data: { userId, token, expiresAt },
  });

  return token;
}

export type VerifiedUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
};

export async function consumeEmailVerificationToken(token: string): Promise<VerifiedUser | null> {
  const record = await prisma.emailVerificationToken.findUnique({
    where: { token },
    include: {
      user: {
        select: { id: true, email: true, name: true, role: true, status: true },
      },
    },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return null;
  }

  const activateAdvertiser = record.user.role === "ADVERTISER";
  const verifiedAt = new Date();

  const user = await prisma.$transaction(async (tx) => {
    await tx.emailVerificationToken.update({
      where: { id: record.id },
      data: { usedAt: verifiedAt },
    });

    return tx.user.update({
      where: { id: record.userId },
      data: {
        emailVerified: verifiedAt,
        ...(activateAdvertiser ? { status: "ACTIVE" } : {}),
      },
      select: { id: true, email: true, name: true, role: true, status: true },
    });
  });

  void (async () => {
    if (user.role === "ADVERTISER" && user.status === "ACTIVE") {
      await notifyAccountActivated(user);
      return;
    }

    if (user.role === "PUBLISHER") {
      await notifyAdminAlert({
        title: "Publisher email verified",
        message: `${user.name} (${user.email}) verified their email and is awaiting admin approval.`,
        actionPath: "/admin/publishers",
        metadata: { userId: user.id, role: user.role },
      });
    }
  })();

  return user;
}
