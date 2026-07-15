import { withAuth } from "@/lib/api-handler";
import { errorResponse, Errors } from "@/lib/errors";
import { campaignTestLeadSchema } from "@/lib/validations";
import { submitAdvertiserTestCampaignLead } from "@/services/lead.service";
import { getCampaignById } from "@/services/campaign.service";

type RouteContext = { params: Promise<{ id: string }> };

async function assertAdvertiserOwnsCampaign(campaignId: string, advertiserId: string) {
  const campaign = await getCampaignById(campaignId);
  if (!campaign) {
    throw Errors.notFound("Campaign");
  }
  if (campaign.advertiserId !== advertiserId) {
    throw Errors.forbidden();
  }
  return campaign;
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return withAuth(async (session) => {
    try {
      await assertAdvertiserOwnsCampaign(id, session.user.id);

      const body = await request.json();
      const parsed = campaignTestLeadSchema.safeParse(body);
      if (!parsed.success) {
        return Response.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: parsed.error.issues[0]?.message ?? "Invalid input",
              status: 422,
            },
          },
          { status: 422 },
        );
      }

      const lead = await submitAdvertiserTestCampaignLead({
        campaignId: id,
        advertiserId: session.user.id,
        data: parsed.data.data,
      });

      return Response.json(
        {
          lead: {
            id: lead.id,
            status: lead.status,
            isTest: true,
          },
        },
        { status: 201 },
      );
    } catch (error) {
      return errorResponse(error);
    }
  }, ["ADVERTISER"]);
}
