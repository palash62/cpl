import { withAuth } from "@/lib/api-handler";
import { errorResponse } from "@/lib/errors";
import {
  deleteOptinFunnelTemplateByAdmin,
  getOptinFunnelTemplateByAdmin,
  updateOptinFunnelTemplateByAdmin,
} from "@/services/optin-funnel.service";
import type { CraftSerializedState } from "@/modules/page-builder/types/page-document";
import type { ThemeJson } from "@/modules/page-builder/lib/theme";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  return withAuth(async () => {
    try {
      const data = await getOptinFunnelTemplateByAdmin(id);
      return Response.json({ data });
    } catch (error) {
      return errorResponse(error);
    }
  }, ["ADMIN"]);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return withAuth(async () => {
    try {
      const body = await request.json();
      const data = await updateOptinFunnelTemplateByAdmin(id, {
        name: typeof body.name === "string" ? body.name : undefined,
        craftState: body.craftState as CraftSerializedState | undefined,
        themeJson: body.themeJson as ThemeJson | undefined,
        autosave: typeof body.autosave === "boolean" ? body.autosave : undefined,
      });
      return Response.json({ data });
    } catch (error) {
      return errorResponse(error);
    }
  }, ["ADMIN"]);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  return withAuth(async () => {
    try {
      const data = await deleteOptinFunnelTemplateByAdmin(id);
      return Response.json({ data });
    } catch (error) {
      return errorResponse(error);
    }
  }, ["ADMIN"]);
}
