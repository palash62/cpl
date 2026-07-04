import { withAuth } from "@/lib/api-handler";
import { errorResponse } from "@/lib/errors";
import { listLandingPageAssets, uploadLandingPageAsset } from "@/modules/page-builder/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  return withAuth(async (session) => {
    const data = await listLandingPageAssets(id, session.user.id);
    return Response.json({ data });
  }, ["ADVERTISER"]);
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return withAuth(async (session) => {
    try {
      const formData = await request.formData();
      const file = formData.get("file");
      if (!(file instanceof File)) {
        return Response.json(
          { error: { code: "VALIDATION_ERROR", message: "File is required", status: 422 } },
          { status: 422 },
        );
      }
      const data = await uploadLandingPageAsset(id, session.user.id, file);
      return Response.json({ data }, { status: 201 });
    } catch (error) {
      return errorResponse(error);
    }
  }, ["ADVERTISER"]);
}
