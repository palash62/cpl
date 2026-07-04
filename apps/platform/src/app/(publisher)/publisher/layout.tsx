import { AppShell } from "@/components/layout/app-shell";
import { getSession } from "@/lib/session";

export default async function PublisherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const role = session?.user?.role ?? "PUBLISHER";

  return (
    <AppShell
      role={role}
      viewAs={
        session?.viewAsMode
          ? { userName: session.user.name, userRole: session.user.role }
          : null
      }
    >
      {children}
    </AppShell>
  );
}
