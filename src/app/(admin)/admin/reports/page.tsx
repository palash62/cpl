import { getAdminDashboardStats } from "@/services/report.service";
import { prisma } from "@/lib/prisma";
import { BarChart3, Building2, DollarSign, FileText, Share2, Users } from "lucide-react";
import { PageHero } from "@/components/admin/page-hero";
import { PageSection } from "@/components/admin/page-section";
import { GradientStatCard, NeutralStatCard } from "@/components/admin/gradient-stat-card";
import { formatCurrency } from "@/components/admin/admin-ui";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const stats = await getAdminDashboardStats();
  const fees = await prisma.platformFee.aggregate({ _sum: { feeAmount: true }, _count: true });
  const payouts = await prisma.payout.groupBy({
    by: ["status"],
    _count: true,
    _sum: { amount: true },
  });

  return (
    <div className="space-y-7">
      <PageHero
        eyebrow="Analytics"
        title="Platform Reports"
        description="Overview of platform performance and revenue"
        badge={`$${stats.revenue.toFixed(2)} revenue`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <GradientStatCard variant="revenue" label="Platform Revenue" value={formatCurrency(stats.revenue)} icon={DollarSign} />
        <GradientStatCard variant="leads" label="Total Leads" value={stats.totalLeads} icon={FileText} />
        <NeutralStatCard label="Advertisers" value={stats.totalAdvertisers} icon={Building2} accent="purple" />
        <NeutralStatCard label="Publishers" value={stats.totalPublishers} icon={Share2} accent="green" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <NeutralStatCard label="Approved Leads" value={stats.approvedLeads} icon={FileText} accent="green" />
        <NeutralStatCard label="Rejected Leads" value={stats.rejectedLeads} icon={FileText} accent="red" />
        <NeutralStatCard label="Open Tickets" value={stats.openTickets} icon={Users} accent="orange" />
        <NeutralStatCard label="Pending Payouts" value={stats.pendingPayouts} icon={BarChart3} accent="purple" />
      </div>

      <PageSection title="Payout Summary" description="Breakdown by payout status" icon={BarChart3} gradient="approved">
        <div className="space-y-1 px-6 py-4">
          {payouts.map((p) => (
            <div key={p.status} className="flex justify-between border-b border-slate-100 py-3 text-sm last:border-0">
              <span className="font-medium capitalize text-slate-700">{p.status.toLowerCase()}</span>
              <span className="font-semibold text-slate-900">
                {p._count} · {formatCurrency(Number(p._sum.amount ?? 0))}
              </span>
            </div>
          ))}
          <p className="pt-3 text-xs text-slate-500">
            {fees._count} platform fees collected · {formatCurrency(Number(fees._sum.feeAmount ?? 0))} total
          </p>
        </div>
      </PageSection>
    </div>
  );
}
