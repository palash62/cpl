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
    <div className="flex h-screen bg-background">
      <Sidebar role={role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title={title} breadcrumbs={breadcrumbs} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
