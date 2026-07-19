import { AppShell } from "@/components/layout/app-shell";
import { canAdvertiserAccessCpaOffers } from "@/lib/cpa-offers-access";
import { getSession } from "@/lib/session";

export default async function AdvertiserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const role = session?.user?.role ?? "ADVERTISER";
  const canAccessCpaOffers = canAdvertiserAccessCpaOffers(session?.user?.email);

  return (
    <AppShell
      role={role}
      canAccessCpaOffers={canAccessCpaOffers}
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
