import { withAuth } from "@/lib/api-handler";
import { errorResponse, Errors } from "@/lib/errors";
import { changePasswordSchema } from "@/lib/validations";
import { changeUserPassword } from "@/services/user.service";

export async function POST(request: Request) {
  return withAuth(async (session) => {
    try {
      if (session.impersonatorId) {
        throw Errors.forbidden();
      }

      const body = await request.json();
      const parsed = changePasswordSchema.safeParse(body);

      if (!parsed.success) {
        const message = parsed.error.issues[0]?.message ?? "Please check the form and try again";
        return Response.json(
          { error: { code: "VALIDATION_ERROR", message, status: 422 } },
          { status: 422 },
        );
      }

      await changeUserPassword(
        session.user.id,
        parsed.data.currentPassword,
        parsed.data.newPassword,
      );

      return Response.json({ success: true });
    } catch (error) {
      return errorResponse(error);
    }
  });
}
