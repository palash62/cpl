import { errorResponse } from "@/lib/errors";
import { verifyEmailSchema, loginSchema } from "@/lib/validations";
import {
  consumeEmailVerificationToken,
  type VerifiedUser,
} from "@/services/auth-token.service";

function verificationMessage(user: VerifiedUser) {
  if (user.role === "ADVERTISER" && user.status === "ACTIVE") {
    return "Email verified — your account is active. Sign in to continue.";
  }
  if (user.role === "PUBLISHER") {
    return "Email verified — your account is pending admin approval.";
  }
  return "Email verified successfully.";
}

export async function GET(request: Request) {
  try {
    const token = new URL(request.url).searchParams.get("token") ?? "";
    const parsed = verifyEmailSchema.safeParse({ token });

    if (!parsed.success) {
      return Response.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid verification link", status: 422 } },
        { status: 422 },
      );
    }

    const user = await consumeEmailVerificationToken(parsed.data.token);
    if (!user) {
      return Response.json(
        { error: { code: "AUTH_INVALID_TOKEN", message: "This verification link is invalid or has expired", status: 422 } },
        { status: 422 },
      );
    }

    return Response.json({
      success: true,
      message: verificationMessage(user),
      role: user.role,
      status: user.status,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = verifyEmailSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid verification token", status: 422 } },
        { status: 422 },
      );
    }

    const user = await consumeEmailVerificationToken(parsed.data.token);
    if (!user) {
      return Response.json(
        { error: { code: "AUTH_INVALID_TOKEN", message: "This verification link is invalid or has expired", status: 422 } },
        { status: 422 },
      );
    }

    return Response.json({
      success: true,
      message: verificationMessage(user),
      role: user.role,
      status: user.status,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
