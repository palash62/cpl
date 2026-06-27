"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigationPending } from "./navigation-pending";

interface SidebarNavLinkProps {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  collapsed?: boolean;
}

function SidebarNavLinkContent({
  label,
  icon: Icon,
  active,
  collapsed,
}: Omit<SidebarNavLinkProps, "href">) {
  const { pending } = useLinkStatus();

  return (
    <>
      <Icon className={cn("h-4 w-4 shrink-0", pending && "animate-pulse")} />
      {!collapsed && (
        <span className={cn("flex-1", pending && "opacity-70")}>{label}</span>
      )}
      {pending && !collapsed && (
        <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-white/80" />
      )}
      <span className="sr-only">{active ? `${label}, current page` : label}</span>
    </>
  );
}

export function SidebarNavLink({
  href,
  label,
  icon,
  active,
  collapsed,
}: SidebarNavLinkProps) {
  const { startNavigation } = useNavigationPending();

  return (
    <Link
      href={href}
      prefetch={true}
      onClick={() => startNavigation()}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
        active
          ? "bg-white shadow-sm text-[var(--theme-sidebar-active-text)]"
          : "text-blue-100/90 hover:bg-white/10 hover:text-white",
      )}
    >
      <SidebarNavLinkContent
        label={label}
        icon={icon}
        active={active}
        collapsed={collapsed}
      />
    </Link>
  );
}
