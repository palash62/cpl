export const dynamic = "force-dynamic";

import { Megaphone, FileText, CheckCircle, XCircle, DollarSign, Wallet } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { LeadsTrendChart, DonutChart } from "@/components/dashboard/dashboard-charts";
import { getAdvertiserDashboardStats } from "@/services/report.service";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";

export default async function AdvertiserDashboardPage() {
  const session = await auth();
  const stats = await getAdvertiserDashboardStats(session!.user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advertiser Dashboard</h2>
          <p className="text-muted-foreground">Campaign performance and lead overview</p>
        </div>
        <ButtonLink href="/advertiser/campaigns/new">Create Campaign</ButtonLink>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Active Campaigns" value={stats.activeCampaigns} icon={Megaphone} />
        <StatCard label="Total Leads" value={stats.totalLeads} icon={FileText} trend={12} />
        <StatCard label="Approved Leads" value={stats.approvedLeads} icon={CheckCircle} trend={8} />
        <StatCard label="Rejected Leads" value={stats.rejectedLeads} icon={XCircle} />
        <StatCard label="Avg Cost Per Lead" value={`$${stats.avgCpl.toFixed(2)}`} icon={DollarSign} />
        <StatCard label="Total Spend" value={`$${stats.totalSpend.toFixed(2)}`} icon={Wallet} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <LeadsTrendChart title="Leads Over Time" data={stats.leadsTrend} />
        <DonutChart
          title="Lead Quality"
          data={[
            { name: "Approved", value: stats.approvedLeads },
            { name: "Rejected", value: stats.rejectedLeads },
          ]}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pending Review Queue</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.pendingLeads.length === 0 ? (
            <p className="text-sm text-muted-foreground">No leads pending review</p>
          ) : (
            stats.pendingLeads.map((lead) => (
              <div key={lead.id} className="flex items-center justify-between border-b py-2 last:border-0">
                <span className="text-sm">{lead.campaign.name}</span>
                <Badge variant="secondary">{lead.status}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
