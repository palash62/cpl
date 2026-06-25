export const dynamic = "force-dynamic";

import { MousePointer, FileText, CheckCircle, Percent, DollarSign, Store } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { LeadsTrendChart } from "@/components/dashboard/dashboard-charts";
import { getPublisherDashboardStats } from "@/services/report.service";
import { auth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { RoleHero } from "@/components/layout/role-hero";

export default async function PublisherDashboardPage() {
  const session = await auth();
  const stats = await getPublisherDashboardStats(session!.user.id);
  const firstName = session?.user?.name?.split(" ")[0] ?? "Publisher";

  return (
    <div className="space-y-7">
      <RoleHero
        eyebrow="Publisher Portal"
        title={`Welcome back, ${firstName}`}
        description="Track clicks, leads, and earnings"
        action={{ label: "Browse Campaigns", href: "/publisher/marketplace", icon: Store }}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Clicks" value={stats.clicks} icon={MousePointer} trend={5} />
        <StatCard label="Leads" value={stats.totalLeads} icon={FileText} trend={12} />
        <StatCard label="Approved Leads" value={stats.approvedLeads} icon={CheckCircle} />
        <StatCard label="Conversion Rate" value={`${stats.conversionRate.toFixed(1)}%`} icon={Percent} />
        <StatCard label="Earnings" value={`$${stats.earnings.toFixed(2)}`} icon={DollarSign} trend={15} />
      </div>

      <LeadsTrendChart
        title="Earnings Trend"
        data={stats.recentLeads.map((_, i) => ({ date: `Day ${i + 1}`, count: stats.earnings / 10 }))}
      />

      <div className="premium-card p-6">
        <h3 className="text-base font-semibold text-slate-900">Recent Leads</h3>
        <div className="mt-4 space-y-2">
          {stats.recentLeads.length === 0 ? (
            <p className="text-sm text-slate-500">No leads yet. Start promoting campaigns!</p>
          ) : (
            stats.recentLeads.map((lead) => (
              <div key={lead.id} className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0">
                <div>
                  <p className="text-sm font-medium text-slate-800">{lead.campaign.name}</p>
                  <p className="text-xs text-slate-500">${Number(lead.campaign.cpl).toFixed(2)} CPL</p>
                </div>
                <Badge variant="outline">{lead.status}</Badge>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
