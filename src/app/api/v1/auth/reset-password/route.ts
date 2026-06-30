import { errorResponse } from "@/lib/errors";
import { resetPasswordSchema } from "@/lib/validations";
import { resetUserPasswordWithToken } from "@/services/user.service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Please check the form and try again";
      return Response.json(
        { error: { code: "VALIDATION_ERROR", message, status: 422 } },
        { status: 422 },
      );
    }

    await resetUserPasswordWithToken(parsed.data.token, parsed.data.newPassword);

    return Response.json({ success: true, message: "Password updated. You can sign in now." });
  } catch (error) {
    return errorResponse(error);
  }
}
