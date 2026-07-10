import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { errorResponse } from "@/lib/errors";
import { resolveReferrerId } from "@/services/referral.service";
import { createEmailVerificationToken } from "@/services/auth-token.service";
import {
  notifyAdminAlert,
  notifyEmailVerification,
  notifyReferralSignup,
  notifyWelcome,
} from "@/services/notify.service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: { code: "VALIDATION_ERROR", message: parsed.error.message, status: 422 } },
        { status: 422 },
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });

    if (existing) {
      return Response.json(
        { error: { code: "AUTH_EMAIL_EXISTS", message: "Email already registered", status: 422 } },
        { status: 422 },
      );
    }

    const referredById = await resolveReferrerId(parsed.data.referralRef);
    const role = "ADVERTISER" as const;
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: parsed.data.email,
          passwordHash,
          name: parsed.data.name,
          role,
          status: "PENDING",
          referredById: referredById ?? undefined,
          wallet: { create: {} },
          advertiserProfile: {
            create: {
              company: parsed.data.name,
              billingInfo: {
                phone: parsed.data.phone,
                address: parsed.data.address,
                country: parsed.data.country,
              },
            },
          },
        },
      });

      return created;
    });

    void (async () => {
      await notifyWelcome({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });

      const verifyToken = await createEmailVerificationToken(user.id);
      await notifyEmailVerification(
        { id: user.id, email: user.email, name: user.name },
        verifyToken,
      );

      const roleLabel = "advertiser";
      await notifyAdminAlert({
        title: `New ${roleLabel} registration`,
        message: `${user.name} (${user.email}) registered and is pending review.`,
        actionPath: "/admin/advertisers",
        metadata: { userId: user.id, role: user.role },
      });

      if (referredById) {
        const referrer = await prisma.user.findUnique({
          where: { id: referredById },
          select: { id: true, email: true, name: true },
        });
        if (referrer) {
          await notifyReferralSignup(referrer, { name: user.name, email: user.email });
        }
      }
    })();

    return Response.json(
      { user: { id: user.id, email: user.email, role: user.role, status: user.status } },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
