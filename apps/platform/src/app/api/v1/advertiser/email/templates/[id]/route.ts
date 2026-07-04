import { withAuth } from "@/lib/api-handler";
import { errorResponse } from "@/lib/errors";
import { emailTemplateUpdateSchema } from "@/lib/validations";
import { deleteTemplate, getTemplate, updateTemplate } from "@/modules/email-marketing";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  return withAuth(async (session) => {
    try {
      const { id } = await params;
      const data = await getTemplate(session.user.id, id);
      return Response.json({ data });
    } catch (error) {
      return errorResponse(error);
    }
  }, ["ADVERTISER"]);
}

export async function PATCH(request: Request, { params }: Params) {
  return withAuth(async (session) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const parsed = emailTemplateUpdateSchema.safeParse(body);
      if (!parsed.success) {
        return Response.json(
          { error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid input", status: 422 } },
          { status: 422 },
        );
      }
      const data = await updateTemplate(session.user.id, id, parsed.data);
      return Response.json({ data });
    } catch (error) {
      return errorResponse(error);
    }
  }, ["ADVERTISER"]);
}

export async function DELETE(_request: Request, { params }: Params) {
  return withAuth(async (session) => {
    try {
      const { id } = await params;
      await deleteTemplate(session.user.id, id);
      return Response.json({ data: { ok: true } });
    } catch (error) {
      return errorResponse(error);
    }
  }, ["ADVERTISER"]);
}
