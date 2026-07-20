"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, LayoutDashboard, Store } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { label: "Dashboard", href: "/advertiser/cpa-offers/dashboard", icon: LayoutDashboard },
  { label: "Offer Marketplace", href: "/advertiser/cpa-offers", icon: Store },
  { label: "Report", href: "/advertiser/cpa-offers/report", icon: BarChart3 },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/advertiser/cpa-offers") {
    return (
      pathname === href ||
      (pathname.startsWith("/advertiser/cpa-offers/") &&
        !pathname.startsWith("/advertiser/cpa-offers/dashboard") &&
        !pathname.startsWith("/advertiser/cpa-offers/report"))
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdvertiserCpaOffersSubNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="CPA Offers"
      className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1"
    >
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href);

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

