import { auth } from "@/lib/auth";
import { Errors } from "@/lib/errors";
import type { UserRole } from "@prisma/client";

export async function getSession() {
  return auth();
}

export async function requireAuth(allowedRoles?: UserRole[]) {
  const session = await auth();
  if (!session?.user) {
    throw Errors.invalidCredentials();
  }
  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    throw Errors.forbidden();
  }
  return session;
}

export async function requireApiAuth(allowedRoles?: UserRole[]) {
  const session = await auth();
  if (!session?.user) {
    return { error: Errors.invalidCredentials(), session: null };
  }
  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    return { error: Errors.forbidden(), session: null };
  }
  return { error: null, session };
}
