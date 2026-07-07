import { withAuth } from "@/lib/api-handler";
import { errorResponse } from "@/lib/errors";
import {
  createOptinFunnelTemplateByAdmin,
  listOptinFunnelTemplatesForAdmin,
} from "@/services/optin-funnel.service";

export async function GET() {
  return withAuth(async () => {
    const data = await listOptinFunnelTemplatesForAdmin();
    return Response.json({ data });
  }, ["ADMIN"]);
}

export async function POST(request: Request) {
  return withAuth(async () => {
    try {
      const body = await request.json();
      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (name.length < 2) {
        return Response.json(
          { error: { code: "VALIDATION_ERROR", message: "Template name must be at least 2 characters." } },
          { status: 422 },
        );
      }

      const primaryColor = typeof body.primaryColor === "string" ? body.primaryColor : undefined;
      const secondaryColor = typeof body.secondaryColor === "string" ? body.secondaryColor : undefined;

      const data = await createOptinFunnelTemplateByAdmin({ name, primaryColor, secondaryColor });
      return Response.json({ data }, { status: 201 });
    } catch (error) {
      return errorResponse(error);
    }
  }, ["ADMIN"]);
}

