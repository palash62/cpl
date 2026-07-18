import { withAuth } from "@/lib/api-handler";
import { errorResponse } from "@/lib/errors";
import { getActiveCpaOfferById } from "@/services/cpa-offer.service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  return withAuth(async () => {
    try {
      const data = await getActiveCpaOfferById(id);
      return Response.json({ data });
    } catch (error) {
      return errorResponse(error);
    }
  }, ["ADVERTISER"]);
}
