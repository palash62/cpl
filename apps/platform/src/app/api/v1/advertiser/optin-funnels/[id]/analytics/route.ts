import { withAuth } from "@/lib/api-handler";
import { errorResponse } from "@/lib/errors";
import { getFunnelAnalyticsSummary } from "@/services/funnel-analytics.service";
import { getOptinFunnel } from "@/services/optin-funnel.service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  return withAuth(async (session) => {
    try {
      // Ownership check (same as funnel CRUD) before returning analytics.
      await getOptinFunnel(id, session.user.id);
      const data = await getFunnelAnalyticsSummary(id);
      return Response.json({ data });
    } catch (error) {
      return errorResponse(error);
    }
  }, ["ADVERTISER"]);
}
