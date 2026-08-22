import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getSession, isAuthorizedAppSession } from "@/lib/session";
import { isAdminPortalRole, parseStaffMenuAccess } from "@/lib/admin-portal";

const FULLSCREEN_ADMIN_FUNNEL =
  /^\/admin\/funnel-templates\/[^/]+\/(edit|preview)(\/|$)/;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = (await headers()).get("x-pathname") ?? "";
  if (FULLSCREEN_ADMIN_FUNNEL.test(pathname)) {
    return children;
  }

  const session = await getSession();
  if (!session?.user || !isAdminPortalRole(session.user.role)) {
    redirect("/login");
  }

  // Stale JWT (e.g. reseeded user / tokenVersion mismatch): clear cookie via route handler.
  // Cannot call signOut() here — cookies may only be modified in Route Handlers / Server Actions.
  // Redirecting to /login alone loops — middleware sends logged-in users back to /admin.
  if (!(await isAuthorizedAppSession(session))) {
    redirect("/api/v1/auth/session-expired");
  }

  return (
    <AppShell
      role={session.user.role}
      staffMenuAccess={parseStaffMenuAccess(session.user.staffMenuAccess)}
    >
      {children}
    </AppShell>
  );
}
