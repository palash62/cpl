import { withAuth } from "@/lib/api-handler";
import { errorResponse } from "@/lib/errors";
import { restoreFunnelVersion } from "@/services/optin-funnel.service";

type RouteContext = { params: Promise<{ id: string; versionId: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { id, versionId } = await context.params;
  return withAuth(async (session) => {
    try {
      const data = await restoreFunnelVersion(id, versionId, session.user.id);
      return Response.json({ data });
    } catch (error) {
      return errorResponse(error);
    }
  }, ["ADVERTISER"]);
}
