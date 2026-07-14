import bcrypt from "bcryptjs";
import { errorResponse } from "@/lib/errors";
import { loginSchema } from "@/lib/validations";
import { getLoginBlock, loginBlockMessage } from "@/lib/auth-login-gate";
import { prisma } from "@/lib/prisma";
import {
  checkRateLimit,
  clientIpFromRequest,
  rateLimitResponse,
} from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = clientIpFromRequest(request);
  const limited = checkRateLimit(`credentials-check:${ip}`, 20, 60_000);
  if (!limited.allowed) {
    return rateLimitResponse(limited.retryAfterSec);
  }

  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid email or password", status: 422 } },
        { status: 422 },
      );
    }

    const email = parsed.data.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        passwordHash: true,
        status: true,
        role: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return Response.json(
        { error: { code: "AUTH_INVALID", message: "Invalid email or password", status: 401 } },
        { status: 401 },
      );
    }

    const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!valid) {
      return Response.json(
        { error: { code: "AUTH_INVALID", message: "Invalid email or password", status: 401 } },
        { status: 401 },
      );
    }

    const block = getLoginBlock(user);
    if (block) {
      return Response.json(
        {
          error: {
            code: block.toUpperCase(),
            message: loginBlockMessage(block),
            status: 403,
          },
        },
        { status: 403 },
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
