import { withAuth } from "@/lib/api-handler";
import { errorResponse } from "@/lib/errors";
import { emailAutomationUpdateSchema } from "@/lib/validations";
import {
  deleteAutomation,
  getAutomation,
  updateAutomation,
} from "@/modules/email-marketing";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  return withAuth(async (session) => {
    try {
      const { id } = await params;
      const data = await getAutomation(session.user.id, id);
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
      const parsed = emailAutomationUpdateSchema.safeParse(body);
      if (!parsed.success) {
        return Response.json(
          { error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid input", status: 422 } },
          { status: 422 },
        );
      }
      const data = await updateAutomation(session.user.id, id, {
        ...parsed.data,
        replyTo: parsed.data.replyTo !== undefined ? parsed.data.replyTo || null : undefined,
      });
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
      await deleteAutomation(session.user.id, id);
      return Response.json({ data: { ok: true } });
    } catch (error) {
      return errorResponse(error);
    }
  }, ["ADVERTISER"]);
}
