import { withAuth } from "@/lib/api-handler";
import { errorResponse } from "@/lib/errors";
import { verifyAdvertiserDomain } from "@/services/advertiser-domain.service";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  return withAuth(async (session) => {
    try {
      const data = await verifyAdvertiserDomain(session.user.id, id);
      return Response.json({ data });
    } catch (error) {
      return errorResponse(error);
    }
  }, ["ADVERTISER"]);
}
