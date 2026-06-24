import { withAuth, parsePagination } from "@/lib/api-handler";
import { listUsers, updateUserStatus } from "@/services/admin.service";
import type { UserRole, UserStatus } from "@prisma/client";

export async function GET(request: Request) {
  return withAuth(async () => {
    const { searchParams } = new URL(request.url);
    const { page, limit } = parsePagination(searchParams);

    const result = await listUsers({
      role: (searchParams.get("role") as UserRole) ?? undefined,
      status: (searchParams.get("status") as UserStatus) ?? undefined,
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
