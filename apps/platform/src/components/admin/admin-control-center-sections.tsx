"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Building2,
  CheckCircle2,
  DollarSign,
  FileText,
  LifeBuoy,
  Megaphone,
  ShieldAlert,
  Users,
  Wallet,
  XCircle,
  TrendingUp,
  Minus,
} from "lucide-react";
import type { AdminControlCenterData } from "@/services/admin-dashboard.service";
import { formatCurrency } from "@/components/admin/admin-ui";
import { ButtonLink } from "@/components/ui/button-link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const cardClass =
  "overflow-hidden rounded-[18px] border border-slate-200/80 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md";

const accentColors = {
  violet: "border-t-violet-500",
  emerald: "border-t-emerald-500",
  sky: "border-t-sky-500",
  amber: "border-t-amber-500",
  rose: "border-t-rose-500",
  indigo: "border-t-indigo-500",
} as const;

type AccentColor = keyof typeof accentColors;

function AccentCard({
  accent = "violet",
  className,
  children,
  padding = true,
}: {
  accent?: AccentColor;
  className?: string;
  children: ReactNode;
  padding?: boolean;
}) {
  return (
    <div className={cn(cardClass, "border-t-[3px]", accentColors[accent], className)}>
      <div className={cn(padding && "p-6")}>{children}</div>
    </div>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
    </div>
  );
}

export function AdminWelcomeSummary({
  userName,
  platformStatus,
  summary,
}: {
  userName: string;
  platformStatus: AdminControlCenterData["platformStatus"];
  summary: AdminControlCenterData["summary"];
}) {
  // Compute greeting/date on the client only — server and browser timezones often differ.
  const [greeting, setGreeting] = useState("Welcome");
  const [todayLabel, setTodayLabel] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening");
    setTodayLabel(format(new Date(), "EEEE, MMMM d, yyyy"));
  }, []);

  return (
    <div
      className="relative overflow-hidden rounded-[18px] px-6 py-5 shadow-md"
      style={{
        backgroundImage: "linear-gradient(to right, var(--theme-hero-from), var(--theme-hero-to))",
      }}
    >
      <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-white/70">
            Platform Control Center
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
            {greeting}, {userName} 👋
          </h1>
          <p className="mt-2 text-sm text-white/85">
            {todayLabel ? `${todayLabel} · ` : null}Platform is{" "}
            <span
              className={cn(
                "font-semibold",
                platformStatus === "Operational" ? "text-emerald-200" : "text-amber-200",
              )}
            >
              {platformStatus === "Operational" ? "running normally" : "experiencing issues"}
            </span>
            .
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              {
                label: "Today's leads",
                value: summary.todaysLeads,
                className: "bg-white/15 text-white border-white/20",
              },
              {
                label: "Pending approval",
                value: summary.pendingLeads,
                className: "bg-amber-400/20 text-amber-50 border-amber-200/30",
              },
              {
                label: "Withdrawals",
                value: summary.pendingWithdrawals,
                className: "bg-emerald-400/20 text-emerald-50 border-emerald-200/30",
              },
              {
                label: "Open tickets",
                value: summary.openTickets,
                className: "bg-sky-400/20 text-sky-50 border-sky-200/30",
              },
            ].map((chip) => (
              <div
                key={chip.label}
                className={cn(
                  "rounded-xl border px-3 py-2 backdrop-blur-sm",
                  chip.className,
                )}
              >
                <p className="text-lg font-bold leading-none">{chip.value}</p>
                <p className="mt-1 text-[11px] font-medium opacity-90">{chip.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <ButtonLink
            href="/admin/leads"
            className="rounded-xl bg-white px-4 text-[var(--theme-hero-btn-text)] shadow-sm hover:bg-white/90"
          >
            Review Leads
          </ButtonLink>
          <ButtonLink
            href="/admin/payouts"
            variant="outline"
            className="rounded-xl border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
          >
            Process Withdrawals
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}

export function AdminActionCenter({
  items,
}: {
  items: AdminControlCenterData["actionItems"];
}) {
  const approvalIds = new Set([
    "leads",
    "campaigns",
    "advertisers",
    "publishers",
  ]);
  const approvalItems = items.filter((item) => approvalIds.has(item.id));
  const opsItems = items.filter((item) => !approvalIds.has(item.id));

  const approvalTotal = approvalItems.reduce((sum, item) => sum + item.count, 0);
  const opsTotal = opsItems.reduce((sum, item) => sum + item.count, 0);

  return (
    <AccentCard accent="rose">
      <SectionHeader
        title="Action Center"
        description="Pending work grouped by priority area"
      />
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50 px-4 py-6 text-center text-sm text-emerald-800">
          All clear — no pending actions require your attention.
        </p>
      ) : (
        <Tabs defaultValue="approvals">
          <TabsList className="mb-4 h-10 w-full max-w-md bg-slate-100 p-1">
            <TabsTrigger value="approvals" className="flex-1 gap-2 px-4">
              Approvals
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
                {approvalTotal}
              </span>
            </TabsTrigger>
            <TabsTrigger value="operations" className="flex-1 gap-2 px-4">
              Payments & Support
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">
                {opsTotal}
              </span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="approvals">
            <AdminActionList list={approvalItems} />
          </TabsContent>
          <TabsContent value="operations">
            <AdminActionList list={opsItems} />
          </TabsContent>
        </Tabs>
      )}
    </AccentCard>
  );
}

function AdminActionList({ list }: { list: AdminControlCenterData["actionItems"] }) {
  if (list.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/80 px-4 py-8 text-center text-sm text-emerald-800">
        All clear in this queue.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {list.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className={cn(
            "group flex items-center justify-between rounded-xl border p-4 transition-all hover:shadow-sm",
            item.critical
              ? "border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/40 hover:border-amber-300"
              : "border-slate-200 bg-slate-50/60 hover:border-[var(--theme-primary)]/25 hover:bg-[var(--theme-primary-soft)]/40",
          )}
        >
          <div>
            <p className="text-2xl font-bold text-slate-900">{item.count}</p>
            <p className="mt-1 text-sm font-medium text-slate-700">{item.label}</p>
            <p className="mt-2 text-xs font-semibold text-[var(--theme-primary)] group-hover:underline">
              {item.action}
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--theme-primary)]" />
        </Link>
      ))}
    </div>
  );
}

export function AdminPendingApprovalCenter({
  lanes,
}: {
  lanes: AdminControlCenterData["approvalLanes"];
}) {
  return (
    <AccentCard accent="amber">
      <SectionHeader
        title="Pending Approval Center"
        description="All approval workflows in one place"
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {lanes.map((lane, index) => {
          const accents: AccentColor[] = ["violet", "emerald", "sky", "indigo", "amber"];
          const accent = accents[index % accents.length];
          return (
          <Link
            key={lane.id}
            href={lane.href}
            className={cn(
              "rounded-xl border border-slate-200 border-t-[3px] bg-gradient-to-b from-white to-slate-50/80 p-4 transition-all hover:shadow-sm",
              accentColors[accent],
              lane.count > 0
                ? "hover:border-[var(--theme-primary)]/30"
                : "opacity-90",
            )}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {lane.title}
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{lane.count}</p>
            <div className="mt-3 flex items-center justify-between gap-2">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-medium",
                  lane.status === "Clear"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-orange-50 text-orange-700",
                )}
              >
                {lane.status}
              </span>
              <span className="text-xs font-medium text-[var(--theme-primary)]">View</span>
            </div>
          </Link>
          );
        })}
      </div>
    </AccentCard>
  );
}

export function AdminTopPerformers({
  data,
}: {
  data: AdminControlCenterData["topPerformers"];
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {[
        {
          title: "Top Advertisers",
          icon: Building2,
          rows: data.advertisers.map((a) => ({
            name: a.name,
            primary: `$${a.spend.toFixed(2)} spend`,
            secondary: `${a.leads} leads · ${a.campaigns} campaigns`,
          })),
        },
        {
          title: "Top Publishers",
          icon: Users,
          rows: data.publishers.map((p) => ({
            name: p.name,
            primary: `${p.approvedLeads} approved leads`,
            secondary: `$${p.earnings.toFixed(2)} balance`,
          })),
        },
        {
          title: "Top Campaigns",
          icon: Megaphone,
          rows: data.campaigns.map((c) => ({
            name: c.name,
            primary: `${c.leads} leads`,
            secondary: `$${c.revenue.toFixed(2)} revenue`,
          })),
        },
      ].map((block, blockIndex) => {
        const accents: AccentColor[] = ["violet", "emerald", "sky"];
        const iconBg = ["bg-violet-50 text-violet-600", "bg-emerald-50 text-emerald-600", "bg-sky-50 text-sky-600"];
        const Icon = block.icon;
        return (
          <AccentCard key={block.title} accent={accents[blockIndex % 3]}>
            <div className="mb-4 flex items-center gap-2">
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", iconBg[blockIndex % 3])}>
                <Icon className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">{block.title}</h3>
            </div>
            <div className="space-y-3">
              {block.rows.length === 0 ? (
                <p className="text-sm text-slate-500">No data yet</p>
              ) : (
                block.rows.map((row, i) => (
                  <div
                    key={`${row.name}-${i}`}
                    className="rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2.5"
                  >
                    <p className="text-sm font-medium text-slate-900">{row.name}</p>
                    <p className="mt-0.5 text-xs text-slate-600">{row.primary}</p>
                    <p className="text-xs text-slate-400">{row.secondary}</p>
                  </div>
                ))
              )}
            </div>
          </AccentCard>
        );
      })}
    </div>
  );
}

export function AdminFinancialSummary({
  financial,
}: {
  financial: AdminControlCenterData["financial"];
}) {
  const items = [
    { label: "Admin Profit", value: formatCurrency(financial.adminProfit), bg: "bg-emerald-50", text: "text-emerald-700" },
    { label: "Advertiser Payments", value: formatCurrency(financial.advertiserPayment), bg: "bg-sky-50", text: "text-sky-700" },
    { label: "Publisher Payouts", value: formatCurrency(financial.publisherPayout), bg: "bg-amber-50", text: "text-amber-700" },
    { label: "Referral Pay", value: formatCurrency(financial.referralPay), bg: "bg-violet-50", text: "text-violet-700" },
    { label: "Wallet Balance", value: formatCurrency(financial.walletBalance), bg: "bg-slate-50", text: "text-slate-700" },
    { label: "Pending Payouts", value: formatCurrency(financial.pendingPayoutsAmount), bg: "bg-orange-50", text: "text-orange-700" },
  ];

  return (
    <AccentCard accent="emerald">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <Wallet className="h-4 w-4" />
        </div>
        <SectionHeader title="Financial Summary" description="Money flow across the platform" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.label} className={cn("rounded-xl border border-slate-100 px-4 py-3", item.bg)}>
            <p className="text-xs font-medium text-slate-500">{item.label}</p>
            <p className={cn("mt-1 text-lg font-bold", item.text)}>{item.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <ButtonLink href="/admin/wallets" size="sm" variant="outline">
          View Wallets
        </ButtonLink>
        <ButtonLink href="/admin/payouts" size="sm" variant="outline">
          Review Withdrawals
        </ButtonLink>
      </div>
    </AccentCard>
  );
}

export function AdminFraudMonitoring({
  fraud,
}: {
  fraud: AdminControlCenterData["fraud"];
}) {
  const items = [
    { label: "Duplicate Flags", value: fraud.duplicateLeads, href: "/admin/fraud?filter=duplicate", bg: "bg-rose-50 hover:bg-rose-100/60" },
    { label: "VPN / Proxy", value: fraud.vpnLeads, href: "/admin/fraud?filter=vpn", bg: "bg-amber-50 hover:bg-amber-100/60" },
    { label: "High Risk", value: fraud.highRiskDevices, href: "/admin/fraud?filter=high-risk", bg: "bg-orange-50 hover:bg-orange-100/60" },
    { label: "Avg Risk Score", value: `${fraud.spamScoreAvg}%`, href: "/admin/fraud", bg: "bg-red-50 hover:bg-red-100/60" },
  ];

  return (
    <AccentCard accent="rose">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <SectionHeader title="Fraud & Quality Monitoring" description="Protect lead quality and advertiser ROI" />
        </div>
        <ButtonLink href="/admin/fraud" size="sm" variant="outline">
          Review
        </ButtonLink>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={cn("rounded-xl border border-slate-200 p-4 transition-colors", item.bg)}
          >
            <p className="text-2xl font-bold text-slate-900">{item.value}</p>
            <p className="mt-1 text-sm text-slate-600">{item.label}</p>
          </Link>
        ))}
      </div>
    </AccentCard>
  );
}

export function AdminSupportSnapshot({
  support,
}: {
  support: AdminControlCenterData["support"];
}) {
  return (
    <AccentCard accent="sky">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
          <LifeBuoy className="h-4 w-4" />
        </div>
        <SectionHeader title="Support Center" description="Customer issues requiring attention" />
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
          <p className="text-2xl font-bold text-slate-900">{support.openTickets}</p>
          <p className="text-sm text-slate-600">Open tickets</p>
        </div>
        <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-4">
          <p className="text-2xl font-bold text-orange-700">{support.urgentTickets}</p>
          <p className="text-sm text-orange-700">High priority</p>
        </div>
      </div>
      {support.recentClosed.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Recently closed
          </p>
          {support.recentClosed.map((ticket) => (
            <div
              key={ticket.id}
              className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm"
            >
              <span className="truncate text-slate-700">{ticket.subject}</span>
              <span className="shrink-0 text-xs text-slate-400">
                {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}
              </span>
            </div>
          ))}
        </div>
      )}
      <ButtonLink href="/admin/support" className="mt-4" size="sm">
        Open Support Center
      </ButtonLink>
    </AccentCard>
  );
}

export function AdminNotificationsPanel({
  notifications,
}: {
  notifications: AdminControlCenterData["notifications"];
}) {
  return (
    <AccentCard accent="indigo">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Bell className="h-4 w-4" />
        </div>
        <SectionHeader title="Notifications" description="Important platform alerts" />
      </div>
      {notifications.length === 0 ? (
        <p className="text-sm text-slate-500">No recent notifications</p>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div key={n.id} className="rounded-lg border border-slate-100 px-3 py-2.5">
              <p className="text-sm font-medium text-slate-800">{n.title}</p>
              <p className="mt-0.5 text-xs text-slate-500">{n.body}</p>
              <p className="mt-1 text-[11px] text-slate-400">
                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
              </p>
            </div>
          ))}
        </div>
      )}
      <ButtonLink href="/admin/notifications" variant="outline" size="sm" className="mt-4">
        View all notifications
      </ButtonLink>
    </AccentCard>
  );
}

export function AdminPlatformHealthPanel({
  health,
  pendingPayouts,
  openTickets,
}: {
  health: AdminControlCenterData["platformHealth"];
  pendingPayouts: number;
  openTickets: number;
}) {
  const services = Object.entries(health).map(([key, status]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    status,
  }));

  return (
    <AccentCard accent="emerald">
      <SectionHeader title="Platform Health" description="Technical systems status" />
      <div className="space-y-2">
        {services.map((service) => (
          <div
            key={service.name}
            className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
          >
            <span className="text-sm text-slate-700">{service.name}</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                service.status === "Healthy"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700",
              )}
            >
              {service.status}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-center">
          <p className="text-xl font-bold text-slate-900">{pendingPayouts}</p>
          <p className="text-xs text-slate-500">Pending payouts</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-center">
          <p className="text-xl font-bold text-slate-900">{openTickets}</p>
          <p className="text-xs text-slate-500">Open tickets</p>
        </div>
      </div>
    </AccentCard>
  );
}

export function AdminRecentActivitiesPanel({
  activities,
}: {
  activities: AdminControlCenterData["recentActivities"];
}) {
  return (
    <AccentCard accent="violet">
      <SectionHeader title="Recent Activities" description="Latest platform events" />
      {activities.length === 0 ? (
        <p className="text-sm text-slate-500">No recent activity</p>
      ) : (
        <div className="space-y-2">
          {activities.map((item) => (
            <div key={item.id} className="rounded-lg border border-slate-100 px-3 py-2.5">
              <p className="text-sm font-medium text-slate-800">
                {item.action.replaceAll("_", " ")} · {item.entityType}
              </p>
              <p className="text-xs text-slate-500">by {item.actorName}</p>
              <p className="mt-1 text-[11px] text-slate-400">
                {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
              </p>
            </div>
          ))}
        </div>
      )}
      <ButtonLink href="/admin/audit-log" variant="outline" size="sm" className="mt-4">
        View audit log
      </ButtonLink>
    </AccentCard>
  );
}

function LeadStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    APPROVED: "bg-emerald-50 text-emerald-700",
    PAID: "bg-cyan-50 text-cyan-700",
    REJECTED: "bg-red-50 text-red-700",
    PENDING: "bg-orange-50 text-orange-700",
    VALIDATING: "bg-violet-50 text-violet-700",
    CAPTURED: "bg-slate-100 text-slate-700",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize",
        styles[status] ?? "bg-slate-100 text-slate-600",
      )}
    >
      {status.toLowerCase()}
    </span>
  );
}

function LeadQuickActions({ leadId, status }: { leadId: string; status: string }) {
  const [loading, setLoading] = useState<string | null>(null);

  async function updateStatus(next: "APPROVED" | "REJECTED") {
    setLoading(next);
    try {
      await fetch("/api/v1/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, status }),
      });
      window.location.reload();
    } finally {
      setLoading(null);
    }
  }

  if (!["PENDING", "VALIDATING", "CAPTURED"].includes(status)) {
    return (
      <ButtonLink href="/admin/leads" variant="outline" size="sm" className="h-7 text-xs">
        View
      </ButtonLink>
    );
  }

  return (
    <div className="flex justify-end gap-1">
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-7 px-2 text-xs text-emerald-700"
        disabled={!!loading}
        onClick={() => updateStatus("APPROVED")}
      >
        <CheckCircle2 className="mr-1 h-3 w-3" />
        Approve
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-7 px-2 text-xs text-red-600"
        disabled={!!loading}
        onClick={() => updateStatus("REJECTED")}
      >
        <XCircle className="mr-1 h-3 w-3" />
        Reject
      </Button>
    </div>
  );
}

export function AdminRecentLeadsPanel({
  leads,
}: {
  leads: AdminControlCenterData["recentLeads"];
}) {
  return (
    <AccentCard accent="sky" padding={false}>
      <div className="border-b border-slate-100 bg-[var(--theme-primary-soft)]/40 px-6 py-5">
        <SectionHeader
          title="Recent Leads"
          description="Quickly review the newest submissions"
        />
      </div>
      {leads.length === 0 ? (
        <p className="px-6 py-12 text-center text-sm text-slate-500">No leads yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/90 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3">Lead</th>
                <th className="px-4 py-3">Campaign</th>
                <th className="px-4 py-3">Publisher</th>
                <th className="px-4 py-3">Advertiser</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-t border-slate-100 hover:bg-blue-50/30">
                  <td className="px-6 py-3 font-medium text-slate-800">{lead.name}</td>
                  <td className="px-4 py-3 text-slate-600">{lead.campaign}</td>
                  <td className="px-4 py-3 text-slate-600">{lead.publisher}</td>
                  <td className="px-4 py-3 text-slate-600">{lead.advertiser}</td>
                  <td className="px-4 py-3">
                    <LeadStatusBadge status={lead.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {format(new Date(lead.createdAt), "MMM d, h:mm a")}
                  </td>
                  <td className="px-6 py-3">
                    <LeadQuickActions leadId={lead.id} status={lead.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AccentCard>
  );
}

export function AdminProfitOverview({
  adminProfit,
}: {
  adminProfit: AdminControlCenterData["adminProfit"];
}) {
  const rows = [
    { label: "Today", snapshot: adminProfit.today, highlight: false },
    { label: "Last 7 Days", snapshot: adminProfit.last7Days, highlight: false },
    { label: "Last 30 Days", snapshot: adminProfit.last30Days, highlight: false },
    { label: "Lifetime", snapshot: adminProfit.lifetime, highlight: true },
  ];

  const lifetime = adminProfit.lifetime;

  return (
    <AccentCard accent="emerald">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <TrendingUp className="h-4 w-4" />
        </div>
        <SectionHeader
          title="Admin Profit"
          description="Advertiser payments − publisher payouts − referral pay"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map((row) => (
          <div
            key={row.label}
            className={cn(
              "rounded-xl border p-3",
              row.highlight
                ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50"
                : "border-slate-100 bg-slate-50/50",
            )}
          >
            <p className="text-xs text-slate-500">{row.label}</p>
            <p
              className={cn(
                "mt-1 text-lg font-bold",
                row.snapshot.adminProfit >= 0
                  ? row.highlight
                    ? "text-emerald-700"
                    : "text-slate-900"
                  : "text-red-600",
              )}
            >
              {formatCurrency(row.snapshot.adminProfit)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-100 bg-sky-50/60 px-4 py-3">
          <p className="text-xs font-medium text-slate-500">Advertiser payments</p>
          <p className="mt-1 text-lg font-bold text-sky-700">
            {formatCurrency(lifetime.advertiserPayment)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-amber-50/60 px-4 py-3">
          <p className="flex items-center gap-1 text-xs font-medium text-slate-500">
            <Minus className="h-3 w-3" />
            Publisher payouts
          </p>
          <p className="mt-1 text-lg font-bold text-amber-700">
            {formatCurrency(lifetime.publisherPayout)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-violet-50/60 px-4 py-3">
          <p className="flex items-center gap-1 text-xs font-medium text-slate-500">
            <Minus className="h-3 w-3" />
            Referral pay
          </p>
          <p className="mt-1 text-lg font-bold text-violet-700">
            {formatCurrency(lifetime.referralPay)}
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Publisher withdrawals and referral commissions reduce admin profit after advertisers pay for
        leads.
      </p>
    </AccentCard>
  );
}

export function AdminRevenueOverview({
  revenue,
}: {
  revenue: AdminControlCenterData["revenue"];
}) {
  const rows = [
    { label: "Today", value: revenue.today, highlight: false },
    { label: "Last 7 Days", value: revenue.last7Days, highlight: false },
    { label: "Last 30 Days", value: revenue.last30Days, highlight: false },
    { label: "Last Month", value: revenue.lastMonth, highlight: false },
    { label: "Lifetime", value: revenue.lifetime, highlight: true },
  ];

  return (
    <AccentCard accent="violet">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
          <DollarSign className="h-4 w-4" />
        </div>
        <SectionHeader title="Revenue Overview" description="Platform commission growth" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {rows.map((row) => (
          <div
            key={row.label}
            className={cn(
              "rounded-xl border p-3",
              row.highlight
                ? "border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50"
                : "border-slate-100 bg-slate-50/50",
            )}
          >
            <p className="text-xs text-slate-500">{row.label}</p>
            <p className={cn("mt-1 text-lg font-bold", row.highlight ? "text-violet-700" : "text-slate-900")}>
              ${row.value.toFixed(2)}
            </p>
          </div>
        ))}
      </div>
    </AccentCard>
  );
}

export function AdminBusinessOverviewStats({
  data,
}: {
  data: AdminControlCenterData["businessOverview"];
}) {
  const stats = [
    { label: "Revenue Today", value: `$${data.revenueToday.toFixed(2)}`, icon: DollarSign },
    { label: "Revenue (MTD)", value: `$${data.revenueMonth.toFixed(2)}`, icon: DollarSign },
    { label: "Active Campaigns", value: data.activeCampaigns, icon: Megaphone },
    { label: "Advertisers", value: data.totalAdvertisers, icon: Building2 },
    { label: "Publishers", value: data.totalPublishers, icon: Users },
    { label: "Today's Leads", value: data.todaysLeads, icon: FileText },
    { label: "Approved Today", value: data.todaysApprovedLeads, icon: CheckCircle2 },
    { label: "Rejected Today", value: data.todaysRejectedLeads, icon: XCircle },
    {
      label: "Conversion Rate",
      value: `${data.conversionRate.toFixed(1)}%`,
      icon: AlertTriangle,
    },
    { label: "Approval Rate", value: `${data.approvalRate.toFixed(1)}%`, icon: CheckCircle2 },
  ];

  const statStyles = [
    { bg: "bg-violet-50", icon: "text-violet-600" },
    { bg: "bg-indigo-50", icon: "text-indigo-600" },
    { bg: "bg-orange-50", icon: "text-orange-600" },
    { bg: "bg-purple-50", icon: "text-purple-600" },
    { bg: "bg-emerald-50", icon: "text-emerald-600" },
    { bg: "bg-sky-50", icon: "text-sky-600" },
    { bg: "bg-green-50", icon: "text-green-600" },
    { bg: "bg-red-50", icon: "text-red-600" },
    { bg: "bg-amber-50", icon: "text-amber-600" },
    { bg: "bg-teal-50", icon: "text-teal-600" },
  ];

  return (
    <AccentCard accent="indigo">
      <SectionHeader title="Business Overview" description="Today's platform performance" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const style = statStyles[index % statStyles.length];
          return (
            <div
              key={stat.label}
              className={cn("rounded-xl border border-slate-100 p-3", style.bg)}
            >
              <div className="flex items-center gap-2 text-slate-500">
                <Icon className={cn("h-3.5 w-3.5", style.icon)} />
                <span className="text-xs font-medium">{stat.label}</span>
              </div>
              <p className="mt-2 text-xl font-bold text-slate-900">{stat.value}</p>
            </div>
          );
        })}
      </div>
    </AccentCard>
  );
}
