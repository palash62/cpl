import { withAuth } from "@/lib/api-handler";
import { errorResponse, Errors } from "@/lib/errors";
import { getActorId } from "@/lib/session";
import {
  deleteCampaignByAdmin,
  getCampaignById,
  updateCampaignByAdmin,
} from "@/services/campaign.service";

function resolveRequestBaseUrl(request: Request) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`;
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
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

      const updated = await updateCampaignByAdmin(id, body, getActorId(session), {
        baseUrl: resolveRequestBaseUrl(request),
      });
      return Response.json({ data: updated });
    } catch (error) {
      return errorResponse(error);
    }
  }, ["ADMIN"]);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withAuth(async (session) => {
    if (session.user.role !== "ADMIN" || session.impersonatorId) {
      return errorResponse(Errors.forbidden());
    }

    try {
      await deleteCampaignByAdmin(id, session.user.id);
      return Response.json({ data: { deleted: true } });
    } catch (error) {
      return errorResponse(error);
    }
  }, ["ADMIN"]);
}
