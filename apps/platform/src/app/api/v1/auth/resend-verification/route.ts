import { errorResponse } from "@/lib/errors";
import { loginSchema } from "@/lib/validations";
import { createEmailVerificationToken } from "@/services/auth-token.service";
import { notifyEmailVerification } from "@/services/notify.service";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.pick({ email: true }).safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: { code: "VALIDATION_ERROR", message: "Enter a valid email address", status: 422 } },
        { status: 422 },
      );
    }

    const email = parsed.data.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, status: true, emailVerified: true },
    });

    if (user && user.status === "PENDING" && !user.emailVerified) {
      const verifyToken = await createEmailVerificationToken(user.id);
      await notifyEmailVerification(
        { id: user.id, email: user.email, name: user.name },
        verifyToken,
      );
    }

    return Response.json({
      success: true,
      message: "If an unverified account exists for this email, a new verification link has been sent.",
    });
  } catch (error) {
    return errorResponse(error);
  }
}
