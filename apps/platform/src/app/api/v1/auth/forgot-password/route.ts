import { errorResponse } from "@/lib/errors";
import { forgotPasswordSchema } from "@/lib/validations";
import { requestPasswordReset } from "@/services/user.service";
import {
  checkRateLimit,
  clientIpFromRequest,
  rateLimitResponse,
} from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = clientIpFromRequest(request);
  const limited = checkRateLimit(`forgot-password:${ip}`, 5, 60_000);
  if (!limited.allowed) {
    return rateLimitResponse(limited.retryAfterSec);
  }

  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Please check the form and try again";
      return Response.json(
        { error: { code: "VALIDATION_ERROR", message, status: 422 } },
        { status: 422 },
      );
    }

    await requestPasswordReset(parsed.data.email);

    return Response.json({
      success: true,
      message: "If an account exists for that email, a reset link has been sent.",
    });
  } catch (error) {
    return errorResponse(error);
  }
}
