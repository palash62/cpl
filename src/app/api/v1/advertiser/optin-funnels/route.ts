import { withAuth } from "@/lib/api-handler";
import { errorResponse } from "@/lib/errors";
import { optinFunnelCreateSchema } from "@/lib/validations";
import { createOptinFunnel, listOptinFunnels } from "@/services/optin-funnel.service";

export async function GET() {
  return withAuth(async (session) => {
    const data = await listOptinFunnels(session.user.id);
    return Response.json({ data });
  }, ["ADVERTISER"]);
}

export async function POST(request: Request) {
  return withAuth(async (session) => {
    try {
      const body = await request.json();
      const parsed = optinFunnelCreateSchema.safeParse(body);
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
      const data = await createOptinFunnel(session.user.id, parsed.data);
      return Response.json({ data }, { status: 201 });
    } catch (error) {
      return errorResponse(error);
    }
  }, ["ADVERTISER"]);
}
