import { errorResponse } from "@/lib/errors";
import { forgotPasswordSchema } from "@/lib/validations";
import { requestPasswordReset } from "@/services/user.service";

export async function POST(request: Request) {
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
