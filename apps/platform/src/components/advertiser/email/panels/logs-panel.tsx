"use client";

import { useMemo } from "react";
import { ScrollText } from "lucide-react";
import { PageSection } from "@/components/admin/page-section";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEmailModuleFilters } from "../email-module-filter-context";
import { EmailModuleShell } from "../email-module-shell";
import { filterByField, filterBySearch, MOCK_EMAIL_LOGS } from "../email-mock-data";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  delivered: "secondary",
  opened: "default",
  clicked: "default",
  bounced: "destructive",
  failed: "destructive",
};

function LogsContent() {
  const { search, filterValues } = useEmailModuleFilters();
  const rows = useMemo(() => {
    let r = filterBySearch(MOCK_EMAIL_LOGS, search, ["recipient", "subject"]);
    r = filterByField(r, "status", filterValues.status);
    return r;
  }, [search, filterValues]);

  return (
    <PageSection title="Delivery History" icon={ScrollText} gradient="leads">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Recipient</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sent At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-slate-500">
                  No logs match your search
                </TableCell>
              </TableRow>
            ) : (
              rows.map((log) => (
                <TableRow key={log.id} className="transition-colors hover:bg-slate-50">
                  <TableCell className="font-medium">{log.recipient}</TableCell>
                  <TableCell className="text-slate-600">{log.subject}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[log.status]}>{log.status}</Badge>
                  </TableCell>
                  <TableCell className="text-slate-500">{log.sentAt}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </PageSection>
  );
}

export function LogsPanel() {
  return (
    <EmailModuleShell
      title="Email Logs"
      description="View delivery history and status for all sent emails."
      breadcrumbs={[
        { label: "Autoresponder", href: "/advertiser/email" },
        { label: "Email Logs" },
      ]}
      stats={[
        { label: "Total Sent", value: "8,420", icon: ScrollText, accent: "purple" },
        { label: "Delivered", value: "98.4%", icon: ScrollText, accent: "green" },
        { label: "Failed", value: "12", icon: ScrollText, accent: "red" },
      ]}
      searchPlaceholder="Search by recipient or subject…"
      filters={[
        {
          id: "status",
          label: "Status",
          options: [
            { value: "delivered", label: "Delivered" },
            { value: "opened", label: "Opened" },
            { value: "clicked", label: "Clicked" },
            { value: "bounced", label: "Bounced" },
            { value: "failed", label: "Failed" },
          ],
        },
      ]}
    >
      <LogsContent />
    </EmailModuleShell>
  );
}
