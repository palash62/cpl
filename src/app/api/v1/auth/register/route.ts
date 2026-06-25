import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { errorResponse } from "@/lib/errors";
import { resolveReferrerId } from "@/services/referral.service";

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
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: parsed.data.email,
          passwordHash,
          name: parsed.data.name,
          role: parsed.data.role,
          status: "PENDING",
          referredById: referredById ?? undefined,
          wallet: { create: {} },
          ...(parsed.data.role === "ADVERTISER" && {
            advertiserProfile: {
              create: { company: parsed.data.company ?? parsed.data.name },
            },
          }),
          ...(parsed.data.role === "PUBLISHER" && {
            publisherProfile: { create: {} },
          }),
        },
      });

      return created;
    });

    return Response.json(
      { user: { id: user.id, email: user.email, role: user.role, status: user.status } },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
