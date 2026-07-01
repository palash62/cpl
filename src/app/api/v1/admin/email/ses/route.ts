import { withAuth } from "@/lib/api-handler";
import { errorResponse } from "@/lib/errors";
import { sesSettingsSchema } from "@/lib/validations";
import { getSesSettingsForAdmin, updateSesSettings } from "@/services/ses-settings.service";
import { sendMarketingEmail } from "@/modules/email-marketing/services/ses-sender.service";
import { getResolvedSesConfig } from "@/services/ses-settings.service";

export async function GET() {
  return withAuth(async () => {
    const data = await getSesSettingsForAdmin();
    return Response.json({ data });
  }, ["ADMIN"]);
}

export async function PATCH(request: Request) {
  return withAuth(async (session) => {
    try {
      const body = await request.json();
      const parsed = sesSettingsSchema.safeParse(body);
      if (!parsed.success) {
        return Response.json(
          { error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid input", status: 422 } },
          { status: 422 },
        );
      }
      const data = await updateSesSettings(parsed.data, session.user.id);
      return Response.json({ data });
    } catch (error) {
      return errorResponse(error);
    }
  }, ["ADMIN"]);
}

export async function POST(request: Request) {
  return withAuth(async (session) => {
    try {
      const body = await request.json();
      const to = typeof body.to === "string" ? body.to : session.user.email;
      const config = await getResolvedSesConfig();
      const result = await sendMarketingEmail({
        to,
        fromName: "CPL Platform",
        fromEmail: config.fromEmail,
        subject: "SES test email",
        html: "<p>SES configuration is working.</p>",
        listUnsubscribeUrl: `${config.appUrl}/unsubscribe/test`,
      });
      if (!result.ok) {
        return Response.json(
          { error: { code: "SES_ERROR", message: result.error, status: 502 } },
          { status: 502 },
        );
      }
      return Response.json({ data: { messageId: result.messageId } });
    } catch (error) {
      return errorResponse(error);
    }
  }, ["ADMIN"]);
}
