export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { format } from "date-fns";
import { ArrowDownLeft, CheckCircle, Clock, History, Plus, TrendingUp, Wallet } from "lucide-react";
import { getSession } from "@/lib/session";
import { getWalletBalance, listPublisherLedger } from "@/services/wallet.service";
import { prisma } from "@/lib/prisma";
import { GradientStatCard, NeutralStatCard } from "@/components/admin/gradient-stat-card";
import { PageSection } from "@/components/admin/page-section";
import { formatCurrency } from "@/components/admin/admin-ui";
import { RoleHero } from "@/components/layout/role-hero";
import { AdvertiserLeadsTableFooter } from "@/components/advertiser/advertiser-leads-table-footer";
import { PublisherInfoBanner } from "@/components/publisher/publisher-info-banner";
import { ButtonLink } from "@/components/ui/button-link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

function shortLedgerId(id: string) {
  return id.slice(-8).toUpperCase();
}

export default async function EarningsPage({ searchParams }: PageProps) {
  const session = await getSession();
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const limit = 10;

  const [balance, ledger, approvedLeads, pendingPayouts] = await Promise.all([
    getWalletBalance(session!.user.id),
    listPublisherLedger(session!.user.id, { page, limit }),
    prisma.lead.count({
      where: { publisherId: session!.user.id, status: { in: ["APPROVED", "PAID"] } },
    }),
    prisma.payout.count({
      where: { publisherId: session!.user.id, status: "REQUESTED" },
    }),
  ]);

  const wallet = balance ?? {
    balance: 0,
    holdBalance: 0,
    availableBalance: 0,
    currency: "USD",
  };

  return (
    <div className="space-y-7">
      <RoleHero
        eyebrow="Publisher Portal"
        title="Earnings"
        description="View your balance, earnings history, and request payouts."
        action={{ label: "Request Payout", href: "/publisher/payouts/request", icon: Plus }}
      />

      <PublisherInfoBanner>
        Earnings are credited to your wallet when leads are approved. Request a payout once your
        available balance meets the platform minimum.
      </PublisherInfoBanner>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <GradientStatCard
          variant="revenue"
          label="Available Balance"
          value={formatCurrency(wallet.availableBalance)}
          icon={Wallet}
        />
        <NeutralStatCard
          label="Total Earned"
          value={formatCurrency(ledger.totalEarned)}
          icon={TrendingUp}
          accent="green"
        />
        <NeutralStatCard
          label="Pending Payouts"
          value={pendingPayouts}
          icon={Clock}
          accent="orange"
        />
        <NeutralStatCard
          label="Approved Leads"
          value={approvedLeads}
          icon={CheckCircle}
          accent="purple"
        />
      </div>

      <PageSection
        title="Quick Payout"
        description="Withdraw your available earnings"
        icon={ArrowDownLeft}
        gradient="revenue"
        contentClassName="p-6"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Ready to withdraw</p>
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(wallet.availableBalance)}
            </p>
          </div>
          <ButtonLink
            href="/publisher/payouts/request"
            className="h-10 rounded-xl bg-[var(--theme-primary)] px-6 hover:opacity-90"
          >
            Request Payout
          </ButtonLink>
        </div>
      </PageSection>

      <div className="premium-card overflow-hidden">
        <div className="h-1" style={{ background: "var(--theme-gradient-approved)" }} />
        <div className="border-b border-slate-100 bg-[var(--theme-primary-soft)] px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
              <Wallet className="h-5 w-5 text-[var(--theme-primary)]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Balance details</h2>
              <p className="text-sm text-slate-500">How your earnings balance is calculated</p>
            </div>
          </div>
        </div>
        <div className="grid gap-0 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
          <div className="flex items-center justify-between px-6 py-4 sm:flex-col sm:items-start sm:gap-1">
            <span className="text-sm text-slate-500">Total balance</span>
            <span className="text-sm font-semibold text-slate-900">
              {formatCurrency(wallet.balance)}
            </span>
          </div>
          <div className="flex items-center justify-between px-6 py-4 sm:flex-col sm:items-start sm:gap-1">
            <span className="text-sm text-slate-500">On hold</span>
            <span className="text-sm font-semibold text-amber-600">
              {formatCurrency(wallet.holdBalance)}
            </span>
          </div>
          <div className="flex items-center justify-between px-6 py-4 sm:flex-col sm:items-start sm:gap-1">
            <span className="text-sm text-slate-500">Available</span>
            <span className="text-sm font-semibold text-emerald-600">
              {formatCurrency(wallet.availableBalance)}
            </span>
          </div>
          <div className="flex items-center justify-between px-6 py-4 sm:flex-col sm:items-start sm:gap-1">
            <span className="text-sm text-slate-500">Lifetime earned</span>
            <span className="text-sm font-semibold text-slate-900">
              {formatCurrency(ledger.totalEarned)}
            </span>
          </div>
        </div>
      </div>

      <PageSection
        title="Earnings Ledger"
        description="Credit entries from approved leads"
        icon={History}
        gradient="leads"
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow
                className="border-none hover:bg-transparent"
                style={{ background: "var(--theme-primary-soft)" }}
              >
                <TableHead className="h-11 px-6 text-slate-600">Date</TableHead>
                <TableHead className="h-11 px-4 text-slate-600">Reference</TableHead>
                <TableHead className="h-11 px-4 text-slate-600">Description</TableHead>
                <TableHead className="h-11 px-4 text-right text-slate-600">Amount</TableHead>
                <TableHead className="h-11 px-6 text-right text-slate-600">Balance After</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ledger.data.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="px-6 py-16 text-center text-slate-500">
                    No earnings yet. Approved leads will appear here.
                  </TableCell>
                </TableRow>
              ) : (
                ledger.data.map((entry) => (
                  <TableRow
                    key={entry.id}
                    className="border-slate-100 transition-colors hover:bg-blue-50/40"
                  >
                    <TableCell className="px-6 py-4 text-sm text-slate-700">
                      {format(entry.createdAt, "MMM d, yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="px-4 py-4 font-mono text-xs text-slate-500">
                      {shortLedgerId(entry.referenceId ?? entry.id)}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-sm text-slate-600">
                      {entry.description ?? entry.referenceType}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-right text-sm font-semibold tabular-nums text-emerald-600">
                      +{formatCurrency(entry.amount)}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right text-sm font-medium tabular-nums text-slate-700">
                      {formatCurrency(entry.balanceAfter)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {ledger.meta.total > 0 && (
          <Suspense fallback={null}>
            <AdvertiserLeadsTableFooter
              page={ledger.meta.page}
              totalPages={ledger.meta.totalPages}
              total={ledger.meta.total}
              perPage={ledger.meta.limit}
            />
          </Suspense>
        )}
      </PageSection>
    </div>
  );
}
