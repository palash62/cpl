import { withAuth } from "@/lib/api-handler";
import { errorResponse } from "@/lib/errors";
import { testConnection } from "@/modules/autoresponder";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  return withAuth(async (session) => {
    try {
      const { id } = await context.params;
      const result = await testConnection(id, session.user.id);
      if (!result.ok) {
        return Response.json(
          {
            error: {
              code: "AUTORESPONDER_TEST_FAILED",
              message: result.error ?? "Test delivery failed",
              status: 422,
            },
            data: result,
          },
          { status: 422 },
        );
      }
      return Response.json({ data: result });
    } catch (error) {
      return errorResponse(error);
    }
  }, ["ADVERTISER"]);
}
