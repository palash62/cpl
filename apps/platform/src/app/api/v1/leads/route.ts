import { withAuth, parsePagination } from "@/lib/api-handler";
import { errorResponse } from "@/lib/errors";
import { listLeads, updateLeadStatus } from "@/services/lead.service";

export async function GET(request: Request) {
  return withAuth(async (session) => {
    const { searchParams } = new URL(request.url);
    const { page, limit } = parsePagination(searchParams);

    const result = await listLeads({
      campaignId: searchParams.get("campaignId") ?? undefined,
      status: (searchParams.get("status") as never) ?? undefined,
      publisherId: session.user.role === "PUBLISHER" ? session.user.id : searchParams.get("publisherId") ?? undefined,
      advertiserId: session.user.role === "ADVERTISER" ? session.user.id : undefined,
      page,
      limit,
    });

    return Response.json(result);
  });
}

export async function PATCH(request: Request) {
  return withAuth(async (session) => {
    try {
      const body = await request.json();
      const { leadId, status, reason } = body;

      if (!leadId || !["APPROVED", "REJECTED"].includes(status)) {
        return Response.json({ error: { code: "VALIDATION_ERROR", status: 422 } }, { status: 422 });
      }

      const lead = await updateLeadStatus(leadId, status, session.user.id, reason);
      return Response.json({ data: lead });
    } catch (error) {
      return errorResponse(error);
    }
  }, ["ADVERTISER", "ADMIN"]);
}
