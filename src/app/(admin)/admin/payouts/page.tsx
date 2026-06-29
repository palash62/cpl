import { prisma } from "@/lib/prisma";
import { Banknote, Clock, DollarSign, Wallet } from "lucide-react";
import { format } from "date-fns";
import { PageHero } from "@/components/admin/page-hero";
import { PageSection } from "@/components/admin/page-section";
import { GradientStatCard, NeutralStatCard } from "@/components/admin/gradient-stat-card";
import { formatCurrency, PayoutStatusBadge } from "@/components/admin/admin-ui";
import { AdminPayoutReviewDialog } from "@/components/admin/admin-payout-review-dialog";
import { PENDING_PAYOUT_STATUSES } from "@/lib/payout-status";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function AdminPayoutsPage() {
  const payouts = await prisma.payout.findMany({
    where: { status: { in: [...PENDING_PAYOUT_STATUSES] } },
    include: {
      publisher: {
        select: {
          name: true,
          email: true,
          wallet: { select: { balance: true, holdBalance: true, currency: true } },
          publisherProfile: {
            select: {
              website: true,
              country: true,
              city: true,
              state: true,
              kycStatus: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalPending = payouts.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-7">
      <PageHero
        eyebrow="Finance"
        title="Payouts Queue"
        description="Review and approve publisher payout requests"
        badge={`${payouts.length} pending`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <GradientStatCard variant="approved" label="Pending Amount" value={formatCurrency(totalPending)} icon={DollarSign} />
        <NeutralStatCard label="Pending Requests" value={payouts.length} icon={Clock} accent="orange" />
        <NeutralStatCard label="Queue Status" value={payouts.length > 0 ? "Active" : "Clear"} icon={Banknote} accent="green" />
      </div>

      <PageSection title="Pending Payouts" description="Requests awaiting admin approval" icon={Wallet} gradient="approved">
        {payouts.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "var(--theme-primary-soft)" }}>
              <Wallet className="h-7 w-7 text-[var(--theme-primary)]" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No pending payouts</h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">All payout requests have been processed.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-none hover:bg-transparent" style={{ background: "var(--theme-primary-soft)" }}>
                <TableHead className="h-11 px-6 text-slate-600">Requested</TableHead>
                <TableHead className="h-11 px-4 text-slate-600">Publisher</TableHead>
                <TableHead className="h-11 px-4 text-right text-slate-600">Amount</TableHead>
                <TableHead className="h-11 px-4 text-slate-600">Method</TableHead>
                <TableHead className="h-11 px-4 text-slate-600">Status</TableHead>
                <TableHead className="h-11 px-6 text-right text-slate-600">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.map((p) => (
                <TableRow key={p.id} className="border-slate-100 transition-colors hover:bg-emerald-50/40">
                  <TableCell className="px-6 py-4 text-sm text-slate-600">
                    {format(p.createdAt, "MMM d, yyyy HH:mm")}
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <p className="font-medium text-slate-900">{p.publisher.name}</p>
                    <p className="text-xs text-slate-500">{p.publisher.email}</p>
                  </TableCell>
                  <TableCell className="px-4 py-4 text-right">
                    <span className="text-lg font-bold text-emerald-600">{formatCurrency(Number(p.amount))}</span>
                  </TableCell>
                  <TableCell className="px-4 py-4 text-sm capitalize text-slate-600">
                    {p.method.toLowerCase().replace(/_/g, " ")}
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <PayoutStatusBadge status={p.status} />
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <AdminPayoutReviewDialog payout={p} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </PageSection>
    </div>
  );
}
