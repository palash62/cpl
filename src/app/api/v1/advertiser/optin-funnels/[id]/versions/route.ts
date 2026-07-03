import { withAuth } from "@/lib/api-handler";
import { listFunnelVersions } from "@/services/optin-funnel.service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  return withAuth(async (session) => {
    const data = await listFunnelVersions(id, session.user.id);
    return Response.json({ data });
  }, ["ADVERTISER"]);
}
