"use client";

import type { UserRole } from "@prisma/client";
import { Suspense } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
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
  return (
    <div className="flex h-screen bg-[var(--theme-bg)]">
      <NavPrefetch role={role} />
      <Sidebar role={role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        {viewAs ? (
          <ImpersonationBanner userName={viewAs.userName} userRole={viewAs.userRole} />
        ) : null}
        <Header title={title} breadcrumbs={breadcrumbs} premium />
        <main className="relative flex-1 overflow-y-auto">
          <Suspense fallback={null}>
            <NavigationProgressBar />
          </Suspense>
          <div className="relative p-6 md:p-8">{children}</div>
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
