import { withAuth } from "@/lib/api-handler";
import { errorResponse } from "@/lib/errors";
import { duplicateLandingPage } from "@/modules/page-builder/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  return withAuth(async (session) => {
    try {
      const data = await duplicateLandingPage(id, session.user.id);
      return Response.json({ data }, { status: 201 });
    } catch (error) {
      return errorResponse(error);
    }
  }, ["ADVERTISER"]);
}
