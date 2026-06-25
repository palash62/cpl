import { withAuth } from "@/lib/api-handler";
import { errorResponse } from "@/lib/errors";
import { updateAdvertiserProfileSchema } from "@/lib/validations";
import { getAdvertiserSettings, updateAdvertiserProfile } from "@/services/user.service";

export async function GET() {
  return withAuth(async (session) => {
    const user = await getAdvertiserSettings(session.user.id);
    return Response.json({ data: user });
  });
}

export async function PATCH(request: Request) {
  return withAuth(async (session) => {
    if (session.user.role !== "ADVERTISER") {
      return Response.json(
        { error: { code: "FORBIDDEN", message: "Advertiser profile only", status: 403 } },
        { status: 403 },
      );
    }

    try {
      const body = await request.json();
      const parsed = updateAdvertiserProfileSchema.safeParse(body);

      if (!parsed.success) {
        const message = parsed.error.issues[0]?.message ?? "Please check the form and try again";
        return Response.json(
          { error: { code: "VALIDATION_ERROR", message, status: 422 } },
          { status: 422 },
        );
      }

      const user = await updateAdvertiserProfile(session.user.id, parsed.data);
      return Response.json({ data: user });
    } catch (error) {
      return errorResponse(error);
    }
  });
}
