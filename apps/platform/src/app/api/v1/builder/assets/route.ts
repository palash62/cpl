import { withAuth } from "@/lib/api-handler";
import { errorResponse } from "@/lib/errors";
import { uploadBuilderAsset } from "@/modules/page-builder/services/builder-asset.service";

export async function POST(request: Request) {
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
      const data = await uploadBuilderAsset(session.user.id, file);
      return Response.json({ data }, { status: 201 });
    } catch (error) {
      return errorResponse(error);
    }
  }, ["ADVERTISER", "ADMIN"]);
}
