"use client";

import type { UserRole } from "@prisma/client";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Megaphone,
  FileText,
  Wallet,
  Banknote,
  BarChart3,
  LifeBuoy,
  Settings,
  ScrollText,
  Link2,
  TrendingUp,
  Gift,
  Palette,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Advertisers", href: "/admin/advertisers", icon: Users },
  { label: "Publishers", href: "/admin/publishers", icon: Users },
  { label: "Campaigns", href: "/admin/campaigns", icon: Megaphone },
  { label: "Leads", href: "/admin/leads", icon: FileText },
  { label: "Wallets", href: "/admin/wallets", icon: Wallet },
  { label: "Payouts", href: "/admin/payouts", icon: Banknote },
  { label: "Reports", href: "/admin/reports", icon: BarChart3 },
  { label: "Support", href: "/admin/support", icon: LifeBuoy },
  { label: "Settings", href: "/admin/settings", icon: Settings },
  { label: "Audit Log", href: "/admin/audit-log", icon: ScrollText },
  { label: "Themes", href: "/admin/themes", icon: Palette },
];

export const ADVERTISER_NAV: NavItem[] = [
  { label: "Dashboard", href: "/advertiser", icon: LayoutDashboard },
  { label: "Campaigns", href: "/advertiser/campaigns", icon: Megaphone },
  { label: "Leads", href: "/advertiser/leads", icon: FileText },
  { label: "Wallet", href: "/advertiser/wallet", icon: Wallet },
  { label: "Referral Link", href: "/advertiser/referal_link", icon: Gift },
  { label: "Reports", href: "/advertiser/reports", icon: BarChart3 },
  { label: "Support", href: "/advertiser/support", icon: LifeBuoy },
  { label: "Settings", href: "/advertiser/settings", icon: Settings },
];

export const PUBLISHER_NAV: NavItem[] = [
  { label: "Dashboard", href: "/publisher", icon: LayoutDashboard },
  { label: "Smart Link", href: "/publisher/smart-link", icon: Link2 },
  { label: "Leads", href: "/publisher/leads", icon: FileText },
  { label: "Earnings", href: "/publisher/earnings", icon: TrendingUp },
  { label: "Payouts", href: "/publisher/payouts", icon: Banknote },
  { label: "Support", href: "/publisher/support", icon: LifeBuoy },
  { label: "Settings", href: "/publisher/settings", icon: Settings },
];

export function getNavForRole(role: UserRole): NavItem[] {
  switch (role) {
    case "ADMIN":
      return ADMIN_NAV;
    case "ADVERTISER":
      return ADVERTISER_NAV;
    case "PUBLISHER":
      return PUBLISHER_NAV;
    default:
      return [];
  }
}
