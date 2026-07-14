"use client";

import { usePathname } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { getNavForRole } from "./nav-config";
import { SidebarNavLink } from "./sidebar-nav-link";

export function SidebarNavList({
  role,
  collapsed,
  onNavigate,
}: {
  role: UserRole;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const items = getNavForRole(role);

  return (
    <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/admin" &&
            item.href !== "/advertiser" &&
            item.href !== "/publisher" &&
            pathname.startsWith(item.href));

        return (
          <div key={item.href} onClick={onNavigate}>
            <SidebarNavLink
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={active}
              collapsed={collapsed}
            />
          </div>
        );
      })}
    </nav>
  );
}

export function SidebarStatusCard() {
  return (
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
  );
}
