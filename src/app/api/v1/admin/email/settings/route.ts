import { withAuth } from "@/lib/api-handler";
import { errorResponse } from "@/lib/errors";
import { smtpSettingsSchema } from "@/lib/validations";
import { getSmtpSettingsForAdmin, updateSmtpSettings } from "@/services/smtp-settings.service";

export async function GET() {
  return withAuth(async () => {
    const data = await getSmtpSettingsForAdmin();
    return Response.json({ data });
  }, ["ADMIN"]);
}

export async function PATCH(request: Request) {
  return withAuth(async (session) => {
    try {
      const body = await request.json();
      const parsed = smtpSettingsSchema.safeParse(body);

      if (!parsed.success) {
        const message = parsed.error.issues[0]?.message ?? "Please check the form and try again";
        return Response.json(
          { error: { code: "VALIDATION_ERROR", message, status: 422 } },
          { status: 422 },
        );
      }

      const data = await updateSmtpSettings(parsed.data, session.user.id);
      return Response.json({ data });
    } catch (error) {
      return errorResponse(error);
    }
  }, ["ADMIN"]);
}
