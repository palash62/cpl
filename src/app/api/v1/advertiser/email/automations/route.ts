import { withAuth } from "@/lib/api-handler";
import { errorResponse } from "@/lib/errors";
import { emailAutomationSchema } from "@/lib/validations";
import { createAutomation, listAutomations } from "@/modules/email-marketing";

export async function GET() {
  return withAuth(async (session) => {
    const data = await listAutomations(session.user.id);
    return Response.json({ data });
  }, ["ADVERTISER"]);
}

export async function POST(request: Request) {
  return withAuth(async (session) => {
    try {
      const body = await request.json();
      const parsed = emailAutomationSchema.safeParse(body);
      if (!parsed.success) {
        return Response.json(
          { error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid input", status: 422 } },
          { status: 422 },
        );
      }
      const data = await createAutomation(session.user.id, {
        ...parsed.data,
        replyTo: parsed.data.replyTo || null,
      });
      return Response.json({ data }, { status: 201 });
    } catch (error) {
      return errorResponse(error);
    }
  }, ["ADVERTISER"]);
}
