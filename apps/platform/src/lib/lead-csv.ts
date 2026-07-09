import { format } from "date-fns";
import { formatAdvertiserLeadCpl } from "@/lib/advertiser-lead-details";
import {
  extractLeadCountry,
  formatLeadRejectReason,
  parseUserAgent,
} from "@/lib/publisher-leads";

export type LeadCsvRow = {
  id: string;
  createdAt: Date;
  campaign: {
    name: string;
    cpl: number | { toString(): string };
    advertiser?: { name: string } | null;
  };
  publisher: { name: string; email: string };
  data: unknown;
  status: string;
  country: string | null;
  source: string | null;
  subId: string | null;
  userAgent: string | null;
  riskScore: number | null;
  validationResults: Array<{ passed: boolean; rule: string; details: string | null }>;
  statusHistory: Array<{ reason: string | null; toStatus: string }>;
};

function escapeCsv(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function leadDataRecord(data: unknown): Record<string, string> {
  if (!data || typeof data !== "object") return {};
  return Object.fromEntries(
    Object.entries(data as Record<string, string>).filter(([, v]) => typeof v === "string"),
  );
}

export function leadsToCsv(leads: LeadCsvRow[], options: { includeAdvertiser?: boolean } = {}) {
  const dataKeys = new Set<string>();
  for (const lead of leads) {
    for (const key of Object.keys(leadDataRecord(lead.data))) {
      dataKeys.add(key);
    }
  }
  const sortedDataKeys = [...dataKeys].sort();

  const baseHeaders = [
    "lead_id",
    "created_at",
    ...(options.includeAdvertiser ? ["advertiser"] : []),
    "campaign",
    "publisher_name",
    ...(options.includeAdvertiser ? ["publisher_email"] : []),
    ...sortedDataKeys,
    "country",
    "source",
    "sub_id",
    "device",
    "os",
    "cpl",
    "risk_score",
    "status",
    "notes",
    ...(options.includeAdvertiser ? ["validation_flags"] : []),
  ];

  const rows = leads.map((lead) => {
    const data = leadDataRecord(lead.data);
    const { device, os } = parseUserAgent(lead.userAgent);
    const country = extractLeadCountry(lead.data, lead.country);
    const cpl = formatAdvertiserLeadCpl(lead.status, Number(lead.campaign.cpl));
    const notes = formatLeadRejectReason(lead);
    const flags = lead.validationResults
      .filter((r) => !r.passed)
      .map((r) => r.rule)
      .join("; ");

    const values = [
      lead.id,
      format(new Date(lead.createdAt), "yyyy-MM-dd HH:mm:ss"),
      ...(options.includeAdvertiser ? [lead.campaign.advertiser?.name ?? ""] : []),
      lead.campaign.name,
      lead.publisher.name,
      ...(options.includeAdvertiser ? [lead.publisher.email] : []),
      ...sortedDataKeys.map((key) => data[key]?.trim() ?? ""),
      country === "—" ? "" : country,
      lead.source ?? "",
      lead.subId ?? "",
      device === "—" ? "" : device,
      os === "—" ? "" : os,
      cpl === "—" ? "" : cpl,
      lead.riskScore?.toString() ?? "",
      lead.status,
      notes === "—" ? "" : notes,
      ...(options.includeAdvertiser ? [flags] : []),
    ];

    return values.map((v) => escapeCsv(v)).join(",");
  });

  return [baseHeaders.join(","), ...rows].join("\r\n");
}
