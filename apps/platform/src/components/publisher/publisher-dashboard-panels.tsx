import { format } from "date-fns";
import { FileText } from "lucide-react";
import { formatCurrency, LeadStatusBadge } from "@/components/admin/admin-ui";
import { PageSection } from "@/components/admin/page-section";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface RecentLead {
  id: string;
  status: string;
  createdAt: Date;
  payoutAmount: number;
}

export function PublisherRecentLeadsTable({ leads }: { leads: RecentLead[] }) {
  return (
    <PageSection
      title="Recent Leads"
      description="Your latest lead submissions"
      icon={FileText}
      gradient="leads"
    >
      {leads.length === 0 ? (
        <div className="px-6 py-12 text-center text-sm text-slate-500">
          No leads yet. Share your Smart Link to start generating leads.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow
              className="border-none hover:bg-transparent"
              style={{ background: "var(--theme-primary-soft)" }}
            >
              <TableHead className="h-11 px-6 text-slate-600">Date</TableHead>
              <TableHead className="h-11 px-4 text-right text-slate-600">Payout</TableHead>
              <TableHead className="h-11 px-6 text-slate-600">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow
                key={lead.id}
                className="border-slate-100 transition-colors hover:bg-blue-50/40"
              >
                <TableCell className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                  {format(lead.createdAt, "MMM d, yyyy HH:mm")}
                </TableCell>
                <TableCell className="px-4 py-4 text-right font-semibold text-[var(--theme-primary)]">
                  {formatCurrency(lead.payoutAmount)}
                </TableCell>
                <TableCell className="px-6 py-4">
                  <LeadStatusBadge status={lead.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </PageSection>
  );
}
