import { BarChart3, Clock } from "lucide-react";
import { formatCurrency } from "@/components/admin/admin-ui";
import { PageSection } from "@/components/admin/page-section";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SummaryRow {
  label: string;
  leads: number;
  cpl: number;
  spent: number;
}

export function AdvertiserSummaryTable({ rows }: { rows: SummaryRow[] }) {
  return (
    <PageSection
      title="Summary Stats"
      description="Leads, CPL, and spend across time periods"
      icon={BarChart3}
      gradient="leads"
    >
      <Table>
        <TableHeader>
          <TableRow
            className="border-none hover:bg-transparent"
            style={{ background: "var(--theme-primary-soft)" }}
          >
            <TableHead className="h-11 px-6 text-slate-600">Period</TableHead>
            <TableHead className="h-11 px-4 text-right text-slate-600">Leads</TableHead>
            <TableHead className="h-11 px-4 text-right text-slate-600">CPL</TableHead>
            <TableHead className="h-11 px-6 text-right text-slate-600">Spent</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.label}
              className="border-slate-100 transition-colors hover:bg-blue-50/40"
            >
              <TableCell className="px-6 py-4 font-medium text-slate-800">{row.label}</TableCell>
              <TableCell className="px-4 py-4 text-right">
                <span className="inline-flex min-w-8 items-center justify-center rounded-md bg-indigo-50 px-2.5 py-1 text-sm font-semibold text-indigo-700">
                  {row.leads}
                </span>
              </TableCell>
              <TableCell className="px-4 py-4 text-right font-semibold text-[var(--theme-primary)]">
                {formatCurrency(row.cpl)}
              </TableCell>
              <TableCell className="px-6 py-4 text-right text-sm font-medium text-slate-700">
                {formatCurrency(row.spent)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </PageSection>
  );
}

export function AdvertiserPendingQueue({
  leads,
}: {
  leads: Array<{ id: string; status: string; campaign: { name: string } }>;
}) {
  return (
    <PageSection
      title="Pending Review Queue"
      description="Leads awaiting your approval"
      icon={Clock}
      gradient="approved"
    >
      {leads.length === 0 ? (
        <div className="px-6 py-12 text-center text-sm text-slate-500">No leads pending review</div>
      ) : (
        <div className="divide-y divide-slate-100">
          {leads.map((lead) => (
            <div
              key={lead.id}
              className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-slate-50/80"
            >
              <span className="text-sm font-medium text-slate-800">{lead.campaign.name}</span>
              <span className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium capitalize text-amber-700">
                {lead.status.toLowerCase()}
              </span>
            </div>
          ))}
        </div>
      )}
    </PageSection>
  );
}
