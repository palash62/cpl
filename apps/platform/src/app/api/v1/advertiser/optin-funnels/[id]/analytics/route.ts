import { withAuth } from "@/lib/api-handler";
import { getFunnelAnalyticsSummary } from "@/services/funnel-analytics.service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  return withAuth(async () => {
    const data = await getFunnelAnalyticsSummary(id);
    return Response.json({ data });
  }, ["ADVERTISER"]);
}
