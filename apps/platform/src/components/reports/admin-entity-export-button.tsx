"use client";

import type { AdminEntityReportRow } from "@/services/report.service";
import { ExportCsvButton } from "@/components/reports/export-csv-button";

export function AdminEntityExportButton({
  rows,
  mode,
  filename,
}: {
  rows: AdminEntityReportRow[];
  mode: "publisher" | "advertiser";
  filename?: string;
}) {
  const csvRows = rows.map((row) => [
    row.name,
    row.email,
    row.clicks,
    row.leads,
    row.approvedLeads,
    row.pendingLeads,
    row.rejectedLeads,
    row.salesCount,
    row.revenue,
    row.conversionRate,
    row.approvalRate,
    mode === "publisher" ? row.earnings : row.spend,
  ]);

  return (
    <ExportCsvButton
      filename={filename ?? `${mode}-reports.csv`}
      headers={[
        "Account",
        "Email",
        "Clicks",
        "Leads",
        "Approved",
        "Pending",
        "Rejected",
        "Sales",
        "Revenue",
        "Conversion %",
        "Approval %",
        mode === "publisher" ? "Earnings" : "Spend",
      ]}
      rows={csvRows}
      label="Export table"
    />
  );
}
