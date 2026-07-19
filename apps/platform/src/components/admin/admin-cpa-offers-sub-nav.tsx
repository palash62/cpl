"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, LayoutDashboard, Store } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { label: "Dashboard", href: "/admin/cpa-offers", exact: true, icon: LayoutDashboard },
  { label: "All Offers", href: "/admin/cpa-offers/offers", icon: Store },
  { label: "Report", href: "/admin/cpa-offers/report", icon: BarChart3 },
] as const;

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  if (href === "/admin/cpa-offers/offers") {
    return (
      pathname === href ||
      pathname.startsWith(`${href}/`) ||
      pathname === "/admin/cpa-offers/new" ||
      /^\/admin\/cpa-offers\/[^/]+\/edit$/.test(pathname)
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminCpaOffersSubNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="CPA Offers"
      className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1"
    >
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href, "exact" in item ? item.exact : false);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-[var(--theme-primary-soft)] text-[var(--theme-primary)]"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
