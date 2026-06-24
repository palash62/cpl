import { withAuth } from "@/lib/api-handler";
import { errorResponse, Errors } from "@/lib/errors";
import { getCampaignById, updateCampaignStatus } from "@/services/campaign.service";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withAuth(async (session) => {
    const campaign = await getCampaignById(id);
    if (!campaign) return errorResponse(Errors.notFound("Campaign"));

    if (
      session.user.role === "ADVERTISER" &&
      campaign.advertiserId !== session.user.id
    ) {
      return errorResponse(Errors.forbidden());
    }

    return Response.json({ data: campaign });
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withAuth(async (session) => {
    try {
      const body = await request.json();
      const campaign = await getCampaignById(id);
      if (!campaign) return errorResponse(Errors.notFound("Campaign"));

      if (
        session.user.role === "ADVERTISER" &&
        campaign.advertiserId !== session.user.id
      ) {
        return errorResponse(Errors.forbidden());
      }

      if (body.status) {
        const updated = await updateCampaignStatus(id, body.status);
        return Response.json({ data: updated });
      }

      const updated = await prisma.campaign.update({
        where: { id },
        data: {
          name: body.name,
          description: body.description,
          cpl: body.cpl,
          budget: body.budget,
          dailyCap: body.dailyCap,
          monthlyCap: body.monthlyCap,
          autoApprove: body.autoApprove,
          targeting: body.targeting,
        },
      });

      return Response.json({ data: updated });
    } catch (error) {
      return errorResponse(error);
    }
  }, ["ADVERTISER", "ADMIN"]);
}
