import { errorResponse } from "@/lib/errors";
import { getLoginBlock, loginBlockMessage } from "@/lib/auth-login-gate";
import { verifyOtpSchema } from "@/lib/validations";
import {
  checkRateLimit,
  clientIpFromRequest,
  rateLimitResponse,
} from "@/lib/rate-limit";
import { checkLoginOtp } from "@/services/auth-token.service";

export async function POST(request: Request) {
  const ip = clientIpFromRequest(request);
  const limited = checkRateLimit(`otp-check:${ip}`, 20, 60_000);
  if (!limited.allowed) {
    return rateLimitResponse(limited.retryAfterSec);
  }

  try {
    const body = await request.json();
    const parsed = verifyOtpSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: { code: "VALIDATION_ERROR", message: "Enter the 6-digit code from your email", status: 422 } },
        { status: 422 },
      );
    }

    const email = parsed.data.email.trim().toLowerCase();
    const user = await checkLoginOtp(email, parsed.data.code);

    if (!user) {
      return Response.json(
        { error: { code: "AUTH_INVALID", message: "Invalid or expired sign-in code", status: 401 } },
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

    if (user.status !== "ACTIVE") {
      return Response.json(
        { error: { code: "AUTH_INVALID", message: "Invalid or expired sign-in code", status: 401 } },
        { status: 401 },
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
