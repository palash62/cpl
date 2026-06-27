export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { format } from "date-fns";
import { Banknote, Plus } from "lucide-react";
import { getSession } from "@/lib/session";
import { listPayouts } from "@/services/payout.service";
import { PageSection } from "@/components/admin/page-section";
import { formatCurrency, PayoutStatusBadge } from "@/components/admin/admin-ui";
import { UsersTablePagination } from "@/components/admin/users-table-pagination";
import { RoleHero } from "@/components/layout/role-hero";
import { PublisherInfoBanner } from "@/components/publisher/publisher-info-banner";
import { PublisherPayoutsSortHeader } from "@/components/publisher/publisher-payouts-sort-header";
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
  searchParams: Promise<{ page?: string; sort?: string }>;
}

export default async function PayoutsPage({ searchParams }: PageProps) {
  const session = await getSession();
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const limit = 10;

  const { data: payouts, meta } = await listPayouts({
    publisherId: session!.user.id,
    page,
    limit,
  });

  return (
    <div className="space-y-6">
      <RoleHero
        eyebrow="Publisher Portal"
        title="Payout History"
        description="Track your payout requests, processing status, and payment methods."
        action={{ label: "Request Payout", href: "/publisher/payouts/request", icon: Plus }}
      />

      <PublisherInfoBanner>
        Request a payout when your available balance meets the minimum threshold. Approved payouts
        are processed to your selected payment method within a few business days.
      </PublisherInfoBanner>

      <PageSection
        title="Payout Requests"
        description={`${meta.total} payout request${meta.total === 1 ? "" : "s"} total`}
        icon={Banknote}
        gradient="revenue"
      >
        {payouts.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div
              className="mb-4 flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: "var(--theme-primary-soft)" }}
            >
              <Banknote className="h-7 w-7 text-[var(--theme-primary)]" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No payout history yet</h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Once you have available earnings, you can request a payout.
            </p>
            <ButtonLink
              href="/publisher/payouts/request"
              className="mt-4 h-9 gap-1.5 rounded-lg bg-[var(--theme-primary)] px-4 text-sm hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Request Payout
            </ButtonLink>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow
                  className="border-none hover:bg-transparent"
                  style={{ background: "var(--theme-primary-soft)" }}
                >
                  <TableHead className="h-11 px-6 text-slate-600">
                    <Suspense fallback={<span>Requested</span>}>
                      <PublisherPayoutsSortHeader field="date" label="Requested" />
                    </Suspense>
                  </TableHead>
                  <TableHead className="h-11 px-4 text-right text-slate-600">
                    <Suspense fallback={<span>Amount</span>}>
                      <PublisherPayoutsSortHeader field="amount" label="Amount" align="right" />
                    </Suspense>
                  </TableHead>
                  <TableHead className="h-11 px-4 text-slate-600">
                    <Suspense fallback={<span>Method</span>}>
                      <PublisherPayoutsSortHeader field="method" label="Method" />
                    </Suspense>
                  </TableHead>
                  <TableHead className="h-11 px-4 text-slate-600">
                    <Suspense fallback={<span>Status</span>}>
                      <PublisherPayoutsSortHeader field="status" label="Status" />
                    </Suspense>
                  </TableHead>
                  <TableHead className="h-11 px-6 text-slate-600">Processed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((payout) => (
                  <TableRow
                    key={payout.id}
                    className="border-slate-100 transition-colors hover:bg-blue-50/40"
                  >
                    <TableCell className="px-6 py-4 text-sm text-slate-700">
                      {format(payout.createdAt, "MMM d, yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-right text-sm font-semibold tabular-nums text-slate-900">
                      {formatCurrency(Number(payout.amount))}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-sm capitalize text-slate-600">
                      {payout.method.toLowerCase().replace("_", " ")}
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <PayoutStatusBadge status={payout.status} />
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm text-slate-600">
                      {payout.processedAt
                        ? format(payout.processedAt, "MMM d, yyyy")
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Suspense>
              <UsersTablePagination page={meta.page} totalPages={meta.totalPages} total={meta.total} />
            </Suspense>
          </>
        )}
      </PageSection>
    </div>
  );
}
