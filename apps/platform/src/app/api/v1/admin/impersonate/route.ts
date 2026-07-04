import { withAuth } from "@/lib/api-handler";
import { errorResponse, Errors } from "@/lib/errors";
import { createImpersonationToken, createRestoreToken } from "@/services/impersonation.service";

export async function POST(request: Request) {
  return withAuth(async (session) => {
    if (session.impersonatorId) {
      return errorResponse(Errors.forbidden());
    }

    const body = await request.json();
    const userId = body?.userId as string | undefined;
    if (!userId) {
      return errorResponse(Errors.validation("userId is required", "userId"));
    }

    const result = await createImpersonationToken(session.user.id, userId);
    return Response.json({ data: result });
  }, ["ADMIN"]);
}

export async function DELETE() {
  return withAuth(async (session) => {
    const adminId = session.impersonatorId;
    if (!adminId) {
      return errorResponse(Errors.validation("Not currently impersonating"));
    }

    const result = await createRestoreToken(adminId);
    return Response.json({ data: result });
  });
}
