import { cache } from "react";
import { auth } from "@/lib/auth";
import { Errors } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

/** Deduplicates auth() within a single server request (layout + page). */
export const getSession = cache(auth);

async function hasValidUserSession(userId: string, role: UserRole) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, status: true },
  });

  if (!user) return false;
  if (user.role !== role) return false;
  if (user.status !== "ACTIVE") return false;
  return true;
}

export async function requireAuth(allowedRoles?: UserRole[]) {
  const session = await getSession();
  if (!session?.user) {
    throw Errors.invalidCredentials();
  }
  const valid = await hasValidUserSession(session.user.id, session.user.role);
  if (!valid) {
    throw Errors.invalidCredentials();
  }
  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    throw Errors.forbidden();
  }
  return session;
}

export async function requireApiAuth(allowedRoles?: UserRole[]) {
  const session = await getSession();
  if (!session?.user) {
    return { error: Errors.invalidCredentials(), session: null };
  }
  const valid = await hasValidUserSession(session.user.id, session.user.role);
  if (!valid) {
    return { error: Errors.invalidCredentials(), session: null };
  }
  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    return { error: Errors.forbidden(), session: null };
  }
  return { error: null, session };
}
