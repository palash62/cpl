"use client";

import Link from "next/link";
import { ButtonLink } from "@/components/ui/button-link";
import { signOut, useSession } from "next-auth/react";
import {
  Bell,
  Search,
  LogOut,
  User,
  Zap,
  Megaphone,
  Building2,
  Users,
  FileText,
  Download,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title?: string;
  breadcrumbs?: string[];
  premium?: boolean;
}

const quickActionLinks = [
  { label: "Create Campaign", href: "/admin/campaigns", icon: Megaphone },
  { label: "Add Advertiser", href: "/admin/advertisers", icon: Building2 },
  { label: "Add Publisher", href: "/admin/publishers", icon: Users },
  { label: "Review Leads", href: "/admin/leads", icon: FileText },
  { label: "Export Report", href: "/admin/reports", icon: Download },
  { label: "Compare Themes", href: "/admin/themes", icon: Palette },
];

export function Header({ title, breadcrumbs, premium }: HeaderProps) {
  const { data: session } = useSession();
  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "U";

  const notificationsHref =
    session?.user?.role === "ADMIN"
      ? "/admin/notifications"
      : session?.user?.role === "ADVERTISER"
        ? "/advertiser/notifications"
        : "/publisher/notifications";

  return (
    <header
      className={cn(
        "flex h-[4.25rem] items-center justify-between px-6 lg:px-8",
        premium
          ? "border-b border-slate-200/60 bg-white/90 backdrop-blur-md"
          : "border-b border-border bg-card",
      )}
    >
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <p className="text-xs text-muted-foreground">{breadcrumbs.join(" / ")}</p>
        )}
        {title && (
          <h1 className={cn("text-lg font-semibold", premium && "text-slate-800")}>
            {title}
          </h1>
        )}
      </div>
      <div className="flex items-center gap-2.5">
        <div className="relative hidden md:block">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search anything..."
            className={cn(
              "h-10 w-72 rounded-xl border-slate-200 bg-slate-50/80 pl-10 text-sm shadow-sm transition-colors focus:bg-white",
              !premium && "w-64",
            )}
          />
        </div>

        {premium && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden h-10 gap-2 rounded-xl border-slate-200 bg-white px-3.5 text-slate-700 shadow-sm hover:bg-slate-50 sm:flex"
                />
              }
            >
              <Zap className="h-4 w-4 text-[var(--theme-primary)]" />
              Quick Actions
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-xl">
              {quickActionLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <DropdownMenuItem key={item.href} render={<Link href={item.href} />}>
                    <Icon className="mr-2 h-4 w-4 text-slate-500" />
                    {item.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {premium && <ThemeSwitcher />}

        <ButtonLink
          href={notificationsHref}
          variant="ghost"
          size="icon"
          className={cn(
            "size-10 rounded-xl text-slate-600 hover:bg-slate-100",
            premium && "border border-slate-200/80 bg-white shadow-sm",
          )}
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </ButtonLink>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                className={cn(
                  "relative h-10 gap-2 rounded-xl px-2 hover:bg-slate-100",
                  premium && "border border-slate-200/80 bg-white pr-3 shadow-sm",
                )}
              />
            }
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback
                className={cn(
                  "text-xs font-semibold",
                  premium
                    ? "bg-[var(--theme-primary)] text-white"
                    : "bg-primary/10 text-primary",
                )}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            {premium && (
              <span className="hidden text-sm font-medium text-slate-700 lg:inline">
                {session?.user?.name?.split(" ")[0]}
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{session?.user?.name}</p>
              <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
