"use client";

import { useState, Suspense } from "react";
import type { UserRole } from "@prisma/client";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { MobileNav } from "./mobile-nav";
import { NavPrefetch } from "./nav-prefetch";
import { ImpersonationBanner } from "./impersonation-banner";
import {
  NavigationPendingProvider,
  NavigationProgressBar,
} from "./navigation-pending";

interface AppShellProps {
  role: UserRole;
  title?: string;
  breadcrumbs?: string[];
  viewAs?: { userName: string; userRole: UserRole } | null;
  children: React.ReactNode;
}

function AppShellInner({ role, title, breadcrumbs, viewAs, children }: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[var(--theme-bg)]">
      <NavPrefetch role={role} />
      <Sidebar role={role} />
      <MobileNav role={role} open={mobileNavOpen} onOpenChange={setMobileNavOpen} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {viewAs ? (
          <ImpersonationBanner userName={viewAs.userName} userRole={viewAs.userRole} />
        ) : null}
        <Header
          role={role}
          title={title}
          breadcrumbs={breadcrumbs}
          premium
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />
        <main className="relative flex-1 overflow-y-auto">
          <Suspense fallback={null}>
            <NavigationProgressBar />
          </Suspense>
          <div className="relative p-4 sm:p-6 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function AppShell(props: AppShellProps) {
  return (
    <NavigationPendingProvider>
      <AppShellInner {...props} />
    </NavigationPendingProvider>
  );
}
