import { withAuth } from "@/lib/api-handler";
import { errorResponse } from "@/lib/errors";
import { emailTemplateSchema } from "@/lib/validations";
import {
  createTemplate,
  listTemplates,
  seedStarterTemplates,
} from "@/modules/email-marketing";

export async function GET() {
  return withAuth(async (session) => {
    await seedStarterTemplates(session.user.id);
    const data = await listTemplates(session.user.id);
    return Response.json({ data });
  }, ["ADVERTISER"]);
}

export async function POST(request: Request) {
  return withAuth(async (session) => {
    try {
      const body = await request.json();
      const parsed = emailTemplateSchema.safeParse(body);
      if (!parsed.success) {
        return Response.json(
          { error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid input", status: 422 } },
          { status: 422 },
        );
      }
      const data = await createTemplate(session.user.id, {
        ...parsed.data,
        textBody: parsed.data.textBody ?? undefined,
        previewText: parsed.data.previewText ?? undefined,
      });
      return Response.json({ data }, { status: 201 });
    } catch (error) {
      return errorResponse(error);
    }
  }, ["ADVERTISER"]);
}
