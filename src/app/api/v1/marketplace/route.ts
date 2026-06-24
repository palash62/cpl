import { withAuth } from "@/lib/api-handler";
import { getMarketplaceCampaigns, joinCampaign, createTrackingLink } from "@/services/campaign.service";

export async function GET() {
  return withAuth(async (session) => {
    const campaigns = await getMarketplaceCampaigns(session.user.id);
    return Response.json({ data: campaigns });
  }, ["PUBLISHER"]);
}

export async function POST(request: Request) {
  return withAuth(async (session) => {
    const body = await request.json();

    if (body.action === "join") {
      const result = await joinCampaign(session.user.id, body.campaignId);
      return Response.json({ data: result });
    }

    if (body.action === "tracking-link") {
      const link = await createTrackingLink(session.user.id, body.campaignId);
      const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
      return Response.json({
        data: {
          ...link,
          url: `${baseUrl}/t/${link.slug}`,
        },
      });
    }

    return Response.json({ error: { code: "VALIDATION_ERROR", status: 422 } }, { status: 422 });
  }, ["PUBLISHER"]);
}
