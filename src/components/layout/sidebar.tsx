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
      className={cn(
        "flex h-full flex-col border-r border-border bg-card",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex h-16 items-center border-b border-border px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-primary">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm text-primary-foreground">
            CP
          </span>
          {!collapsed && <span>CPL Platform</span>}
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-3">
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
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
