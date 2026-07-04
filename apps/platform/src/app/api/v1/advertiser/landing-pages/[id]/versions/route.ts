import { withAuth } from "@/lib/api-handler";
import { listPageVersions } from "@/modules/page-builder/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  return withAuth(async (session) => {
    const data = await listPageVersions(id, session.user.id);
    return Response.json({ data });
  }, ["ADVERTISER"]);
}
