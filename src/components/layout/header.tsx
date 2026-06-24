"use client";

import { ButtonLink } from "@/components/ui/button-link";
import { signOut, useSession } from "next-auth/react";
import { Bell, Search, LogOut, User } from "lucide-react";
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

interface HeaderProps {
  title?: string;
  breadcrumbs?: string[];
}

export function Header({ title, breadcrumbs }: HeaderProps) {
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
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <p className="text-xs text-muted-foreground">{breadcrumbs.join(" / ")}</p>
        )}
        {title && <h1 className="text-lg font-semibold">{title}</h1>}
      </div>
      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search..." className="w-64 pl-9" />
        </div>
        <ButtonLink href={notificationsHref} variant="ghost" size="icon" className="size-8" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </ButtonLink>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" className="relative h-8 w-8 rounded-full" />
            }
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
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
