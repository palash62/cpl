import { withAuth } from "@/lib/api-handler";
import { errorResponse } from "@/lib/errors";
import { advertiserEmailSettingsSchema } from "@/lib/validations";
import {
  getAdvertiserEmailSettings,
  updateAdvertiserEmailSettings,
} from "@/modules/email-marketing";

export async function GET() {
  return withAuth(async (session) => {
    const data = await getAdvertiserEmailSettings(session.user.id);
    return Response.json({ data });
  }, ["ADVERTISER"]);
}

export async function PATCH(request: Request) {
  return withAuth(async (session) => {
    try {
      const body = await request.json();
      const parsed = advertiserEmailSettingsSchema.safeParse(body);
      if (!parsed.success) {
        return Response.json(
          { error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid input", status: 422 } },
          { status: 422 },
        );
      }
      await updateAdvertiserEmailSettings(session.user.id, parsed.data);
      const data = await getAdvertiserEmailSettings(session.user.id);
      return Response.json({ data });
    } catch (error) {
      return errorResponse(error);
    }
  }, ["ADVERTISER"]);
}
