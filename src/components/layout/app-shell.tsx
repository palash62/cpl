"use client";

import type { UserRole } from "@prisma/client";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

interface AppShellProps {
  role: UserRole;
  title?: string;
  breadcrumbs?: string[];
  children: React.ReactNode;
}

export function AppShell({ role, title, breadcrumbs, children }: AppShellProps) {
  return (
    <div className="flex h-screen bg-[var(--theme-bg)]">
      <Sidebar role={role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title={title} breadcrumbs={breadcrumbs} premium />
        <main className="relative flex-1 overflow-y-auto">
          <div className="relative p-6 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
