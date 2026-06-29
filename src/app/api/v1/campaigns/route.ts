import { withAuth, parsePagination } from "@/lib/api-handler";
import { errorResponse } from "@/lib/errors";
import { adminCreateCampaignSchema, campaignSchema } from "@/lib/validations";
import { prisma } from "@/lib/prisma";
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
      const isAdmin = session.user.role === "ADMIN";

      if (isAdmin) {
        const parsed = adminCreateCampaignSchema.safeParse(body);
        if (!parsed.success) {
          const message = parsed.error.issues[0]?.message ?? parsed.error.message;
          return Response.json(
            { error: { code: "VALIDATION_ERROR", message, status: 422 } },
            { status: 422 },
          );
        }

        const { advertiserId, destinationUrl, vertical, ...campaignData } = parsed.data;
        const advertiser = await prisma.user.findFirst({
          where: { id: advertiserId, role: "ADVERTISER" },
          select: { id: true },
        });
        if (!advertiser) {
          return Response.json(
            { error: { code: "NOT_FOUND", message: "Advertiser not found", status: 404 } },
            { status: 404 },
          );
        }

        const campaign = await createCampaign({
          ...campaignData,
          advertiserId,
          description: campaignData.description ?? `Destination: ${destinationUrl}`,
          targeting: {
            ...(campaignData.targeting ?? {}),
            destinationUrl,
            vertical,
          },
          status: campaignData.status ?? "ACTIVE",
          fields: campaignData.fields,
        });

        return Response.json({ data: campaign }, { status: 201 });
      }

      const parsed = campaignSchema.safeParse(body);
      if (!parsed.success) {
        return Response.json(
          { error: { code: "VALIDATION_ERROR", message: parsed.error.message, status: 422 } },
          { status: 422 },
        );
      }

      const campaign = await createCampaign({
        advertiserId: session.user.id,
        ...parsed.data,
        status: "PENDING",
      });

      return Response.json({ data: campaign }, { status: 201 });
    } catch (error) {
      return errorResponse(error);
    }
  }, ["ADVERTISER", "ADMIN"]);
}
