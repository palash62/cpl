import { withAuth } from "@/lib/api-handler";
import { errorResponse } from "@/lib/errors";
import { duplicateOptinFunnel } from "@/services/optin-funnel.service";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  return withAuth(async (session) => {
    try {
      const data = await duplicateOptinFunnel(id, session.user.id);
      return Response.json({ data });
    } catch (error) {
      return errorResponse(error);
    }
  }, ["ADVERTISER"]);
}
