import bcrypt from "bcryptjs";
import type { z } from "zod";
import { AppError } from "@/lib/errors";
import { validateEmailDeliverability } from "@/lib/email-deliverability";
import type { publisherRegisterSchema } from "@/lib/validations";
import { prisma } from "@/lib/prisma";
import { createEmailVerificationToken } from "@/services/auth-token.service";
import { getResolvedEmailConfig } from "@/services/smtp-settings.service";
import {
  notifyAdminAlert,
  notifyEmailVerification,
  notifyWelcome,
} from "@/services/notify.service";

type PublisherRegisterInput = z.infer<typeof publisherRegisterSchema>;

export async function registerPublisherAccount(data: PublisherRegisterInput) {
  const email = data.email.trim().toLowerCase();
  const deliverability = await validateEmailDeliverability(email);
  if (!deliverability.ok) {
    throw new AppError("VALIDATION_INVALID_EMAIL", deliverability.reason, 422);
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing) {
    throw new AppError("AUTH_EMAIL_EXISTS", "Email already registered", 422);
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await prisma.$transaction(async (tx) => {
    return tx.user.create({
      data: {
        email,
        passwordHash,
        name: data.name.trim(),
        role: "PUBLISHER",
        status: "PENDING",
        wallet: { create: {} },
        publisherProfile: {
          create: {
            website: data.website?.trim() || undefined,
            trafficSource: data.trafficSource?.trim() || undefined,
            country: data.country?.trim() || undefined,
            addressLine1: data.addressLine1?.trim() || undefined,
            addressLine2: data.addressLine2?.trim() || undefined,
            city: data.city?.trim() || undefined,
            state: data.state?.trim() || undefined,
            postalCode: data.postalCode?.trim() || undefined,
          },
        },
      },
    });
  });

  const welcome = await notifyWelcome({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
  if (!welcome.sent) {
    console.error("[register:publisher] welcome failed", {
      userId: user.id,
      skipped: welcome.skipped,
      error: welcome.error,
    });
  }

  const verifyToken = await createEmailVerificationToken(user.id);
  const verification = await notifyEmailVerification(
    { id: user.id, email: user.email, name: user.name },
    verifyToken,
  );
  if (!verification.sent) {
    console.error("[register:publisher] verification failed", {
      userId: user.id,
      skipped: verification.skipped,
      error: verification.error,
    });
  }

  if (process.env.NODE_ENV === "development" && verification.skipped) {
    const config = await getResolvedEmailConfig();
    const verifyUrl = `${config.appUrl}/verify-email?token=${encodeURIComponent(verifyToken)}`;
    console.info("[register:publisher:dev] Email skipped — verification link:", verifyUrl);
  }

  void notifyAdminAlert({
    title: "New publisher application",
    message: `${user.name} (${user.email}) signed up as a publisher and is awaiting email verification.`,
    actionPath: "/admin/publishers",
    metadata: { userId: user.id, role: user.role },
  });

  const emailDelivery = {
    verificationSent: verification.sent,
    welcomeSent: welcome.sent,
    ...(verification.skipped || welcome.skipped ? { skipped: true } : {}),
    ...(verification.error || welcome.error
      ? { error: verification.error ?? welcome.error }
      : {}),
  };

  return { user, emailDelivery };
}
