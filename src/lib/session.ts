import { cache } from "react";
import { headers, cookies } from "next/headers";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";
import { Errors } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";
import { parseViewAsCookie, shouldApplyViewAs, VIEW_AS_COOKIE } from "@/lib/view-as";

type AppSession = Session & { viewAsMode?: boolean };

async function resolveViewAsSession(session: Session): Promise<AppSession> {
  const cookieStore = await cookies();
  const viewAs = await parseViewAsCookie(cookieStore.get(VIEW_AS_COOKIE)?.value);
  if (!viewAs) return session;

  const headerStore = await headers();
  const pathname = headerStore.get("x-pathname") ?? "";
  const referer = headerStore.get("referer");

  if (!shouldApplyViewAs(pathname, referer, viewAs.role)) {
    return session;
  }

  return {
    ...session,
    user: {
      id: viewAs.userId,
      email: viewAs.email,
      name: viewAs.name,
      role: viewAs.role,
    },
    impersonatorId: viewAs.impersonatorId,
    viewAsMode: true,
  };
}

/** Deduplicates auth() within a single server request (layout + page). */
export const getSession = cache(async (): Promise<AppSession | null> => {
  const session = await auth();
  if (!session?.user) return session;
  return resolveViewAsSession(session);
});

async function hasValidUserSession(userId: string, role: UserRole) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, status: true },
  });

  if (!user) return false;
  if (user.role !== role) return false;
  if (user.status === "SUSPENDED") return false;
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

/** Returns the real admin id when impersonating, otherwise the session user id for admins. */
export function getActorId(session: { user: { id: string; role: UserRole }; impersonatorId?: string }) {
  return session.impersonatorId ?? session.user.id;
}

export async function requireRealAdmin() {
  const session = await auth();
  if (!session?.user) {
    throw Errors.invalidCredentials();
  }
  if (session.user.role !== "ADMIN") {
    throw Errors.forbidden();
  }
  const valid = await hasValidUserSession(session.user.id, "ADMIN");
  if (!valid) {
    throw Errors.invalidCredentials();
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
