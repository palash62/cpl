import { withAuth } from "@/lib/api-handler";
import { errorResponse } from "@/lib/errors";
import { optinPageColorsSchema } from "@/lib/validations";
import { updateAdvertiserOptinColors } from "@/services/optin-page.service";

export async function PUT(request: Request) {
  return withAuth(async (session) => {
    try {
      const body = await request.json();
      const parsed = optinPageColorsSchema.safeParse(body);

      if (!parsed.success) {
        return Response.json(
          { error: { code: "VALIDATION_ERROR", message: parsed.error.message, status: 422 } },
          { status: 422 },
        );
      }

      const page = await updateAdvertiserOptinColors(
        session.user.id,
        parsed.data.primaryColor,
        parsed.data.accentColor,
      );

      return Response.json({ page });
    } catch (error) {
      return errorResponse(error);
    }
  }, ["ADVERTISER"]);
}
