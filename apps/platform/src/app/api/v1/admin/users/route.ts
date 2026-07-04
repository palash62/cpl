import { withAuth, parsePagination } from "@/lib/api-handler";
import { errorResponse } from "@/lib/errors";
import { adminCreatePublisherSchema } from "@/lib/validations";
import { createPublisherAccount, listUsers, updateUserStatus } from "@/services/admin.service";
import type { UserRole, UserStatus } from "@prisma/client";

export async function GET(request: Request) {
  return withAuth(async () => {
    const { searchParams } = new URL(request.url);
    const { page, limit } = parsePagination(searchParams);

    const result = await listUsers({
      role: (searchParams.get("role") as UserRole) ?? undefined,
      status: (searchParams.get("status") as UserStatus) ?? undefined,
      search: searchParams.get("q") ?? undefined,
      dateFrom: searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined,
      dateTo: searchParams.get("to") ? new Date(searchParams.get("to")!) : undefined,
      page,
      limit,
    });

    return Response.json(result);
  }, ["ADMIN"]);
}

export async function PATCH(request: Request) {
  return withAuth(async (session) => {
    const body = await request.json();
    const user = await updateUserStatus(body.userId, body.status, session.user.id);
    return Response.json({ data: user });
  }, ["ADMIN"]);
}

export async function POST(request: Request) {
  return withAuth(async () => {
    try {
      const body = await request.json();
      const parsed = adminCreatePublisherSchema.safeParse(body);

      if (!parsed.success) {
        const message = parsed.error.issues[0]?.message ?? "Please check the form and try again";
        return Response.json(
          { error: { code: "VALIDATION_ERROR", message, status: 422 } },
          { status: 422 },
        );
      }

      const result = await createPublisherAccount(parsed.data);
      return Response.json({ data: result }, { status: 201 });
    } catch (error) {
      return errorResponse(error);
    }
  }, ["ADMIN"]);
}
