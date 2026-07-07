import { withAuth } from "@/lib/api-handler";
import { errorResponse } from "@/lib/errors";
import { optinFunnelUpdateSchema } from "@/lib/validations";
import {
  deleteOptinFunnel,
  getOptinFunnel,
  updateOptinFunnel,
} from "@/services/optin-funnel.service";
import type { CraftSerializedState } from "@/modules/page-builder/types/page-document";
import type { ThemeJson } from "@/modules/page-builder/lib/theme";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  return withAuth(async (session) => {
    const data = await getOptinFunnel(id, session.user.id);
    return Response.json({ data });
  }, ["ADVERTISER"]);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return withAuth(async (session) => {
    try {
      const body = await request.json();
      const parsed = optinFunnelUpdateSchema.safeParse(body);
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
      const data = await updateOptinFunnel(id, session.user.id, {
        ...parsed.data,
        templateId: parsed.data.templateId as string | undefined,
        craftState: parsed.data.craftState as CraftSerializedState | undefined,
        themeJson: parsed.data.themeJson as ThemeJson | undefined,
        thankYouCraftState: parsed.data.thankYouCraftState as CraftSerializedState | undefined,
        thankYouThemeJson: parsed.data.thankYouThemeJson as ThemeJson | undefined,
      });
      return Response.json({ data });
    } catch (error) {
      return errorResponse(error);
    }
  }, ["ADVERTISER"]);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  return withAuth(async (session) => {
    try {
      await deleteOptinFunnel(id, session.user.id);
      return Response.json({ ok: true });
    } catch (error) {
      return errorResponse(error);
    }
  }, ["ADVERTISER"]);
}
