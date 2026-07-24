import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import {
  getAdminProfitPageData,
  resolveProfitPageRange,
} from "@/services/admin-profit.service";
import { PageHero } from "@/components/admin/page-hero";
import { AdminProfitFilters } from "@/components/admin/admin-profit-filters";
import {
  AdminProfitReportTable,
  AdminProfitSummaryCards,
} from "@/components/admin/admin-profit-page";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    period?: string;
    from?: string;
    to?: string;
    group?: string;
  }>;
}

export default async function AdminProfitPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const params = await searchParams;
  const range = resolveProfitPageRange(params);
  const data = await getAdminProfitPageData(range.from, range.to, range.groupBy);

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Finance"
        title="Profit calculation"
        description="Platform profit split into admin (80%) and partner (20%) shares for the selected period."
      />

      <Suspense fallback={<div className="h-28 animate-pulse rounded-[18px] bg-slate-100" />}>
        <AdminProfitFilters
          period={range.period}
          fromStr={range.fromStr}
          toStr={range.toStr}
          groupBy={range.groupBy}
        />
      </Suspense>

      <AdminProfitSummaryCards summary={data.summary} />

      <AdminProfitReportTable rows={data.rows} fromStr={range.fromStr} toStr={range.toStr} />
    </div>
  );
}
