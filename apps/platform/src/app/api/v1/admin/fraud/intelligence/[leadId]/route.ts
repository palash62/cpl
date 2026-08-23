import { withAuth, ADMIN_PORTAL_ROLES } from "@/lib/api-handler";
import { errorResponse } from "@/lib/errors";
import { getLeadIntelligenceForAdmin } from "@/modules/fraud";

export async function GET(
  request: Request,
  context: { params: Promise<{ leadId: string }> },
) {
  return withAuth(async () => {
    try {
      const { leadId } = await context.params;
      const { searchParams } = new URL(request.url);
      const recompute = searchParams.get("recompute") === "1";
      const data = await getLeadIntelligenceForAdmin(leadId, { recompute });
      return Response.json({ data });
    } catch (error) {
      return errorResponse(error);
    }
  }, ADMIN_PORTAL_ROLES);
}
