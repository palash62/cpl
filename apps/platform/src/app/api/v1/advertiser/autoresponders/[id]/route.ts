import { withAuth } from "@/lib/api-handler";
import { errorResponse } from "@/lib/errors";
import { autoresponderConnectionUpdateSchema } from "@/lib/validations";
import {
  deleteAdvertiserConnection,
  getConnection,
  updateAdvertiserConnection,
} from "@/modules/autoresponder";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  return withAuth(async (session) => {
    const data = await getConnection(id, session.user.id);
    return Response.json({ data });
  }, ["ADVERTISER"]);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return withAuth(async (session) => {
    try {
      const body = await request.json();
      const parsed = autoresponderConnectionUpdateSchema.safeParse(body);
      if (!parsed.success) {
        return Response.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: parsed.error.issues[0]?.message ?? "Invalid input",
              status: 422,
            },
          },
          { status: 422 },
        );
      }

      const data = await updateAdvertiserConnection(id, session.user.id, parsed.data);
      return Response.json({ data });
    } catch (error) {
      return errorResponse(error);
    }
  }, ["ADVERTISER"]);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  return withAuth(async (session) => {
    try {
      await deleteAdvertiserConnection(id, session.user.id);
      return Response.json({ ok: true });
    } catch (error) {
      return errorResponse(error);
    }
  }, ["ADVERTISER"]);
}
