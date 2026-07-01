"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Overview", href: "/advertiser/email" },
  { label: "Automations", href: "/advertiser/email/automations" },
  { label: "Templates", href: "/advertiser/email/templates" },
  { label: "Contacts", href: "/advertiser/email/contacts" },
  { label: "Activity", href: "/advertiser/email/activity" },
  { label: "Settings", href: "/advertiser/email/settings" },
];

export function EmailSubNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
      {TABS.map((tab) => {
        const active =
          tab.href === "/advertiser/email"
            ? pathname === tab.href
            : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-[var(--theme-primary-soft)] text-[var(--theme-primary)]"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
