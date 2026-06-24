import { withAuth, parsePagination } from "@/lib/api-handler";
import { errorResponse } from "@/lib/errors";
import { campaignSchema } from "@/lib/validations";
import { createCampaign, listCampaigns } from "@/services/campaign.service";

export async function GET(request: Request) {
  return withAuth(async (session) => {
    const { searchParams } = new URL(request.url);
    const { page, limit } = parsePagination(searchParams);

    const result = await listCampaigns({
      advertiserId: session.user.role === "ADVERTISER" ? session.user.id : searchParams.get("advertiserId") ?? undefined,
      status: (searchParams.get("status") as never) ?? undefined,
      page,
      limit,
    });

    return Response.json(result);
  });
}

export async function POST(request: Request) {
  return withAuth(async (session) => {
    if (session.user.role !== "ADVERTISER" && session.user.role !== "ADMIN") {
      return Response.json({ error: { code: "PERMISSION_DENIED", status: 403 } }, { status: 403 });
    }

    try {
      const body = await request.json();
      const parsed = campaignSchema.safeParse(body);

      if (!parsed.success) {
        return Response.json(
          { error: { code: "VALIDATION_ERROR", message: parsed.error.message, status: 422 } },
          { status: 422 },
        );
      }

      const campaign = await createCampaign({
        advertiserId: session.user.role === "ADMIN" && body.advertiserId ? body.advertiserId : session.user.id,
        ...parsed.data,
      });

      return Response.json({ data: campaign }, { status: 201 });
    } catch (error) {
      return errorResponse(error);
    }
  }, ["ADVERTISER", "ADMIN"]);
}
