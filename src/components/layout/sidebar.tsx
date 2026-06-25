"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { UserRole } from "@prisma/client";
import { getNavForRole } from "./nav-config";

interface SidebarProps {
  role: UserRole;
  collapsed?: boolean;
}

export function Sidebar({ role, collapsed }: SidebarProps) {
  const pathname = usePathname();
  const items = getNavForRole(role);

  return (
    <aside
      className={cn("flex h-full flex-col shadow-lg", collapsed ? "w-16" : "w-64")}
      style={{
        backgroundImage: "linear-gradient(to bottom, var(--theme-sidebar-from), var(--theme-sidebar-to))",
      }}
    >
      <div className="flex h-16 items-center border-b border-white/10 px-4">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 text-sm font-bold text-white">
            CP
          </span>
          {!collapsed && <span className="text-[15px] tracking-tight">CPL Platform</span>}
        </Link>
      </div>
      <nav className="flex-1 space-y-0.5 p-3">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/admin" &&
              item.href !== "/advertiser" &&
              item.href !== "/publisher" &&
              pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-white shadow-sm text-[var(--theme-sidebar-active-text)]"
                  : "text-blue-100/90 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>
      {!collapsed && (
        <div className="mx-3 mb-4 rounded-xl border border-white/10 bg-white/5 p-3.5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-blue-200/80">
            Platform Status
          </p>
          <p className="mt-1 text-sm font-medium text-white">All systems operational</p>
          <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full w-4/5 rounded-full"
              style={{ backgroundColor: "var(--theme-success)" }}
            />
          </div>
        </div>
      )}
    </aside>
  );
}
