import { withAuth } from "@/lib/api-handler";
import { errorResponse } from "@/lib/errors";
import { isOptinTemplateId } from "@/lib/optin-templates";
import { selectAdvertiserOptinTemplate } from "@/services/optin-page.service";

export async function POST(request: Request) {
  return withAuth(async (session) => {
    try {
      const body = await request.json();
      const templateId = body.templateId as string | undefined;

      if (!templateId || !isOptinTemplateId(templateId)) {
        return Response.json(
          { error: { code: "VALIDATION_ERROR", message: "Invalid template", status: 422 } },
          { status: 422 },
        );
      }

      const page = await selectAdvertiserOptinTemplate(session.user.id, templateId);
      return Response.json({ page });
    } catch (error) {
      return errorResponse(error);
    }
  }, ["ADVERTISER"]);
}
