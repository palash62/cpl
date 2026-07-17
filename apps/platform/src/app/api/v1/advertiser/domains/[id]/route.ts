import { withAuth } from "@/lib/api-handler";
import { errorResponse } from "@/lib/errors";
import { removeAdvertiserDomain } from "@/services/advertiser-domain.service";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  return withAuth(async (session) => {
    try {
      await removeAdvertiserDomain(session.user.id, id);
      return Response.json({ ok: true });
    } catch (error) {
      return errorResponse(error);
    }
  }, ["ADVERTISER"]);
}
