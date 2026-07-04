import { withAuth } from "@/lib/api-handler";
import { errorResponse } from "@/lib/errors";
import { publishLandingPage } from "@/modules/page-builder/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  return withAuth(async (session) => {
    try {
      const data = await publishLandingPage(id, session.user.id);
      return Response.json({ data });
    } catch (error) {
      return errorResponse(error);
    }
  }, ["ADVERTISER"]);
}
