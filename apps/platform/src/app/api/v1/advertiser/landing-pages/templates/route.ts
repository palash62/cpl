import { withAuth } from "@/lib/api-handler";
import { errorResponse } from "@/lib/errors";
import {
  exportTemplate,
  importTemplate,
  listTemplates,
  toggleTemplateFavorite,
} from "@/modules/page-builder/server";
import { templateImportSchema } from "@/lib/validations";

export async function GET(request: Request) {
  return withAuth(async (session) => {
    const category = new URL(request.url).searchParams.get("category") ?? undefined;
    const data = await listTemplates(session.user.id, category ?? undefined);
    return Response.json({ data });
  }, ["ADVERTISER"]);
}

export async function POST(request: Request) {
  return withAuth(async (session) => {
    try {
      const body = await request.json();

      if (body.action === "favorite" && body.templateId) {
        const data = await toggleTemplateFavorite(session.user.id, body.templateId);
        return Response.json({ data });
      }

      if (body.action === "export" && body.templateId) {
        const data = await exportTemplate(body.templateId);
        return Response.json({ data });
      }

      const parsed = templateImportSchema.safeParse(body);
      if (!parsed.success) {
        return Response.json(
          { error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid template", status: 422 } },
          { status: 422 },
        );
      }
      const data = await importTemplate(session.user.id, parsed.data as import("@/modules/page-builder/types/page-document").TemplateExport);
      return Response.json({ data }, { status: 201 });
    } catch (error) {
      return errorResponse(error);
    }
  }, ["ADVERTISER"]);
}
