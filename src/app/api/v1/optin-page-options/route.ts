import { withAuth } from "@/lib/api-handler";
import { listAdvertiserOptinPageOptions } from "@/services/optin-page.service";

export async function GET(request: Request) {
  return withAuth(async (session) => {
    const { searchParams } = new URL(request.url);
    const advertiserId =
      session.user.role === "ADMIN"
        ? searchParams.get("advertiserId") ?? undefined
        : session.user.id;

    if (!advertiserId) {
      return Response.json(
        { error: { code: "VALIDATION_ERROR", message: "Select an advertiser", status: 422 } },
        { status: 422 },
      );
    }

    if (session.user.role === "ADVERTISER" && advertiserId !== session.user.id) {
      return Response.json({ error: { code: "PERMISSION_DENIED", status: 403 } }, { status: 403 });
    }

    const pages = await listAdvertiserOptinPageOptions(advertiserId);
    return Response.json({ pages });
  }, ["ADVERTISER", "ADMIN"]);
}
