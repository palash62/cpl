import { format } from "date-fns";
import { FileText, Megaphone } from "lucide-react";
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
  campaign: { name: string; cpl: unknown };
}

interface TopCampaign {
  campaignId: string;
  name: string;
  approvedLeads: number;
  earnings: number;
}

export function PublisherRecentLeadsTable({ leads }: { leads: RecentLead[] }) {
  return (
    <PageSection
      title="Recent Leads"
      description="Your latest lead submissions across campaigns"
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
              <TableHead className="h-11 px-4 text-slate-600">Campaign</TableHead>
              <TableHead className="h-11 px-4 text-right text-slate-600">CPL</TableHead>
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
                <TableCell className="px-4 py-4 font-medium text-slate-800">
                  {lead.campaign.name}
                </TableCell>
                <TableCell className="px-4 py-4 text-right font-semibold text-[var(--theme-primary)]">
                  {formatCurrency(Number(lead.campaign.cpl))}
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

export function PublisherTopCampaignsTable({ campaigns }: { campaigns: TopCampaign[] }) {
  return (
    <PageSection
      title="Top Campaigns"
      description="Best performing campaigns by approved leads"
      icon={Megaphone}
      gradient="approved"
    >
      {campaigns.length === 0 ? (
        <div className="px-6 py-12 text-center text-sm text-slate-500">
          No approved leads yet. Join campaigns to start earning.
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {campaigns.map((campaign) => (
            <div
              key={campaign.campaignId}
              className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-slate-50/80"
            >
              <div>
                <p className="text-sm font-medium text-slate-800">{campaign.name}</p>
                <p className="text-xs text-slate-500">{campaign.approvedLeads} approved leads</p>
              </div>
              <span className="text-sm font-semibold text-emerald-600">
                {formatCurrency(campaign.earnings)}
              </span>
            </div>
          ))}
        </div>
      )}
    </PageSection>
  );
}
