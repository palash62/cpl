import { withAuth } from "@/lib/api-handler";
import { errorResponse } from "@/lib/errors";
import { landingPageUpdateSchema } from "@/lib/validations";
import {
  deleteLandingPage,
  getLandingPage,
  updateLandingPage,
} from "@/modules/page-builder/server";
import type { CraftSerializedState } from "@/modules/page-builder/types/page-document";
import type { ThemeJson } from "@/modules/page-builder/lib/theme";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  return withAuth(async (session) => {
    const data = await getLandingPage(id, session.user.id);
    return Response.json({ data });
  }, ["ADVERTISER"]);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return withAuth(async (session) => {
    try {
      const body = await request.json();
      const parsed = landingPageUpdateSchema.safeParse(body);
      if (!parsed.success) {
        return Response.json(
          { error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid input", status: 422 } },
          { status: 422 },
        );
      }
      const craftState = parsed.data.craftState as CraftSerializedState | undefined;
      const data = await updateLandingPage(id, session.user.id, {
        ...parsed.data,
        craftState,
        themeJson: parsed.data.themeJson as ThemeJson | undefined,
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
      await deleteLandingPage(id, session.user.id);
      return Response.json({ ok: true });
    } catch (error) {
      return errorResponse(error);
    }
  }, ["ADVERTISER"]);
}
