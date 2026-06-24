export const dynamic = "force-dynamic";

import { MousePointer, FileText, CheckCircle, Percent, DollarSign } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { LeadsTrendChart } from "@/components/dashboard/dashboard-charts";
import { getPublisherDashboardStats } from "@/services/report.service";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";

export default async function PublisherDashboardPage() {
  const session = await auth();
  const stats = await getPublisherDashboardStats(session!.user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Publisher Dashboard</h2>
          <p className="text-muted-foreground">Track clicks, leads, and earnings</p>
        </div>
        <ButtonLink href="/publisher/marketplace">Browse Campaigns</ButtonLink>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Clicks" value={stats.clicks} icon={MousePointer} trend={5} />
        <StatCard label="Leads" value={stats.totalLeads} icon={FileText} trend={12} />
        <StatCard label="Approved Leads" value={stats.approvedLeads} icon={CheckCircle} />
        <StatCard label="Conversion Rate" value={`${stats.conversionRate.toFixed(1)}%`} icon={Percent} />
        <StatCard label="Earnings" value={`$${stats.earnings.toFixed(2)}`} icon={DollarSign} trend={15} />
      </div>

      <LeadsTrendChart title="Earnings Trend" data={stats.recentLeads.map((_, i) => ({ date: `Day ${i + 1}`, count: stats.earnings / 10 }))} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Leads</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentLeads.length === 0 ? (
            <p className="text-sm text-muted-foreground">No leads yet. Start promoting campaigns!</p>
          ) : (
            stats.recentLeads.map((lead) => (
              <div key={lead.id} className="flex items-center justify-between border-b py-2 last:border-0">
                <div>
                  <p className="text-sm font-medium">{lead.campaign.name}</p>
                  <p className="text-xs text-muted-foreground">${Number(lead.campaign.cpl).toFixed(2)} CPL</p>
                </div>
                <Badge>{lead.status}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
