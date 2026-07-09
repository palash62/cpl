import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getSession } from "@/lib/session";
import { reconcilePublisherLeadCreditsForUser } from "@/services/wallet.service";

export default async function PublisherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }

  await reconcilePublisherLeadCreditsForUser(session.user.id);

  return (
    <AppShell
      role={session.user.role}
      viewAs={
        session.viewAsMode
          ? { userName: session.user.name, userRole: session.user.role }
          : null
      }
    >
      {children}
    </AppShell>
  );
}
