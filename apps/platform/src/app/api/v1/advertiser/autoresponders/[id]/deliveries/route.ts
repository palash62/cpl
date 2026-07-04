import { withAuth, parsePagination } from "@/lib/api-handler";
import { listDeliveries, getConnection } from "@/modules/autoresponder";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  return withAuth(async (session) => {
    const { id } = await context.params;
    await getConnection(id, session.user.id);
    const { searchParams } = new URL(request.url);
    const { page, limit } = parsePagination(searchParams);
    const result = await listDeliveries(id, page, limit);
    return Response.json(result);
  }, ["ADVERTISER"]);
}
