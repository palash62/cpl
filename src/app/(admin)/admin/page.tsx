import { format } from "date-fns";
import { getSession } from "@/lib/session";
import {
  Building2,
  Users,
  Megaphone,
  FileText,
  CheckCircle,
  XCircle,
  DollarSign,
} from "lucide-react";
import { getAdminDashboardStats } from "@/services/report.service";
import { AdminHero } from "@/components/admin/admin-hero";
import { AdminQuickActions } from "@/components/admin/admin-quick-actions";
import { GradientStatCard, NeutralStatCard } from "@/components/admin/gradient-stat-card";
import {
  AdminLeadsTrendChart,
  AdminLeadStatusChart,
  AdminPlatformBarChart,
  ColorfulProgressStat,
  AdminHealthCard,
} from "@/components/admin/admin-dashboard-charts";
import { AdminActivityTimeline } from "@/components/admin/admin-activity-timeline";
import { AdminRecentLeadsTable } from "@/components/admin/admin-recent-leads-table";

export default async function AdminDashboardPage() {
  const [stats, session] = await Promise.all([getAdminDashboardStats(), getSession()]);
  const firstName = session?.user?.name?.split(" ")[0] ?? "Admin";

  const todayKey = format(new Date(), "yyyy-MM-dd");
  const todaysLeads =
    stats.leadsTrend.find((d) => d.date === todayKey)?.count ??
    stats.leadsTrend.at(-1)?.count ??
    0;

  const pendingLeads = Math.max(
    0,
    stats.totalLeads - stats.approvedLeads - stats.rejectedLeads,
  );

  const leadStatusData = [
    { name: "Approved", value: stats.approvedLeads, color: "#22C55E" },
    { name: "Pending", value: pendingLeads, color: "#F97316" },
    { name: "Rejected", value: stats.rejectedLeads, color: "#EF4444" },
  ].filter((d) => d.value > 0);

  const platformData = [
    { name: "Advertisers", value: stats.totalAdvertisers },
    { name: "Publishers", value: stats.totalPublishers },
    { name: "Campaigns", value: stats.totalCampaigns },
    { name: "Leads", value: stats.totalLeads },
  ];

  return (
    <div className="space-y-7">
      <AdminHero userName={firstName} />

      <AdminQuickActions />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <GradientStatCard
          variant="revenue"
          label="Revenue"
          value={`$${stats.revenue.toFixed(2)}`}
          icon={DollarSign}
          trend={18}
        />
        <GradientStatCard
          variant="leads"
          label="Today's Leads"
          value={todaysLeads}
          icon={FileText}
          trend={15}
        />
        <GradientStatCard
          variant="approved"
          label="Approved Leads"
          value={stats.approvedLeads}
          icon={CheckCircle}
          trend={10}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <NeutralStatCard
          accent="purple"
          label="Advertisers"
          value={stats.totalAdvertisers}
          icon={Building2}
          trend={12}
        />
        <NeutralStatCard
          accent="green"
          label="Publishers"
          value={stats.totalPublishers}
          icon={Users}
          trend={8}
        />
        <NeutralStatCard
          accent="orange"
          label="Campaigns"
          value={stats.totalCampaigns}
          icon={Megaphone}
        />
        <NeutralStatCard
          accent="red"
          label="Rejected Leads"
          value={stats.rejectedLeads}
          icon={XCircle}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AdminLeadsTrendChart data={stats.leadsTrend} />
        </div>
        <AdminHealthCard>
          <div className="mb-5">
            <h3 className="text-base font-semibold text-slate-900">Platform Health</h3>
            <p className="mt-0.5 text-sm text-slate-500">Performance metrics at a glance</p>
          </div>
          <div className="space-y-4">
            <ColorfulProgressStat
              label="Lead Approval Rate"
              value={stats.approvedLeads}
              max={stats.totalLeads || 1}
              color="#22C55E"
            />
            <ColorfulProgressStat
              label="Active Advertisers"
              value={stats.totalAdvertisers}
              max={Math.max(stats.totalAdvertisers, 10)}
              color="#8B5CF6"
            />
            <ColorfulProgressStat
              label="Active Publishers"
              value={stats.totalPublishers}
              max={Math.max(stats.totalPublishers, 10)}
              color="#10B981"
            />
            <ColorfulProgressStat
              label="Campaign Utilization"
              value={stats.totalCampaigns}
              max={Math.max(stats.totalCampaigns, 5)}
              color="#F97316"
            />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{stats.pendingPayouts}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">Pending Payouts</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{stats.openTickets}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">Open Tickets</p>
            </div>
          </div>
        </AdminHealthCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {leadStatusData.length > 0 && <AdminLeadStatusChart data={leadStatusData} />}
        <AdminPlatformBarChart data={platformData} />
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <AdminActivityTimeline
            recentLeads={stats.recentLeads}
            pendingPayouts={stats.pendingPayouts}
            openTickets={stats.openTickets}
          />
        </div>
        <div className="lg:col-span-3">
          <AdminRecentLeadsTable leads={stats.recentLeads} />
        </div>
      </div>
    </div>
  );
}
