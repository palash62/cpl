"use client";

import type { UserRole } from "@prisma/client";
import type { LucideIcon } from "lucide-react";
import {
  ArrowDownToLine,
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
  LayoutTemplate,
  FileStack,
  Palette,
  ShieldAlert,
  Plug,
  Mail,
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
  { label: "Bulk Email", href: "/admin/bulk-email", icon: Mail },
  { label: "Leads", href: "/admin/leads", icon: FileText },
  { label: "Fraud Center", href: "/admin/fraud", icon: ShieldAlert },
  { label: "Wallets", href: "/admin/wallets", icon: Wallet },
  { label: "Deposits", href: "/admin/deposits", icon: ArrowDownToLine },
  { label: "Payouts", href: "/admin/payouts", icon: Banknote },
  { label: "Reports", href: "/admin/reports", icon: BarChart3 },
  { label: "Support", href: "/admin/support", icon: LifeBuoy },
  { label: "Settings", href: "/admin/settings", icon: Settings },
  { label: "Audit Log", href: "/admin/audit-log", icon: ScrollText },
  { label: "Themes", href: "/admin/themes", icon: Palette },
];

export const ADVERTISER_NAV: NavItem[] = [
  { label: "Dashboard", href: "/advertiser", icon: LayoutDashboard },
  { label: "Optin Funnel", href: "/advertiser/optin-funnels", icon: LayoutTemplate },
  { label: "Campaigns", href: "/advertiser/campaigns", icon: Megaphone },
  { label: "Integrations", href: "/advertiser/integrations", icon: Plug },
  { label: "Lead Report", href: "/advertiser/lead-report", icon: BarChart3 },
  { label: "Lead Details", href: "/advertiser/lead-details", icon: FileText },
  { label: "Wallet", href: "/advertiser/wallet", icon: Wallet },
  { label: "Referral Link", href: "/advertiser/referal_link", icon: Gift },
  { label: "Reports", href: "/advertiser/reports", icon: BarChart3 },
  { label: "Support", href: "/advertiser/support", icon: LifeBuoy },
  { label: "Settings", href: "/advertiser/settings", icon: Settings },
  { label: "Autoresponder", href: "/advertiser/email", icon: Mail },
];

export const PUBLISHER_NAV: NavItem[] = [
  { label: "Dashboard", href: "/publisher", icon: LayoutDashboard },
  { label: "Smart Link", href: "/publisher/smart-link", icon: Link2 },
  { label: "Leads", href: "/publisher/leads", icon: FileText },
  { label: "Earnings & Payouts", href: "/publisher/earnings", icon: Wallet },
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
