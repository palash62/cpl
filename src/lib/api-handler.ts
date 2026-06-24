import { errorResponse } from "@/lib/errors";
import { requireApiAuth } from "@/lib/session";
import type { UserRole } from "@prisma/client";

export async function withAuth<T>(
  handler: (session: NonNullable<Awaited<ReturnType<typeof requireApiAuth>>["session"]>) => Promise<T>,
  roles?: UserRole[],
) {
  const { error, session } = await requireApiAuth(roles);
  if (error || !session) return errorResponse(error ?? new Error("Unauthorized"));
  return handler(session);
}

export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  return { page, limit };
}
