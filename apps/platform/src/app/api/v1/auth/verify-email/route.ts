import { errorResponse } from "@/lib/errors";
import { AppError } from "@/lib/errors";
import { verifyEmailSchema } from "@/lib/validations";
import { consumeEmailVerificationToken } from "@/services/auth-token.service";

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

    return Response.json({ success: true, message: "Email verified successfully." });
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
      return errorResponse(
        new AppError("AUTH_INVALID_TOKEN", "This verification link is invalid or has expired", 422),
      );
    }

    return Response.json({ success: true, message: "Email verified successfully." });
  } catch (error) {
    return errorResponse(error);
  }
}
