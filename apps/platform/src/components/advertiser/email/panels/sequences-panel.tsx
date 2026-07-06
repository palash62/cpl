"use client";

import { useMemo } from "react";
import { GitBranch, Plus } from "lucide-react";
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
import { filterBySearch, MOCK_SEQUENCES } from "../email-mock-data";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  active: "default",
  paused: "outline",
  draft: "secondary",
};

function SequencesContent() {
  const { search } = useEmailModuleFilters();
  const rows = useMemo(
    () => filterBySearch(MOCK_SEQUENCES, search, ["name"]),
    [search],
  );

  return (
    <PageSection title="Drip Sequences" icon={GitBranch} gradient="approved">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Steps</TableHead>
              <TableHead>Subscribers</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                  No sequences match your search
                </TableCell>
              </TableRow>
            ) : (
              rows.map((seq) => (
                <TableRow key={seq.id} className="transition-colors hover:bg-slate-50">
                  <TableCell className="font-medium">{seq.name}</TableCell>
                  <TableCell>{seq.steps}</TableCell>
                  <TableCell>{seq.subscribers}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[seq.status]}>{seq.status}</Badge>
                  </TableCell>
                  <TableCell className="text-slate-500">{seq.updatedAt}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </PageSection>
  );
}

export function SequencesPanel() {
  return (
    <EmailModuleShell
      title="Sequences"
      description="Build drip email sequences that nurture subscribers over time."
      breadcrumbs={[
        { label: "Autoresponder", href: "/advertiser/email" },
        { label: "Sequences" },
      ]}
      stats={[
        { label: "Active Sequences", value: "2", icon: GitBranch, accent: "purple" },
        { label: "Total Steps", value: "12", icon: GitBranch, accent: "green" },
        { label: "Enrolled", value: "470", icon: GitBranch, accent: "orange" },
      ]}
      searchPlaceholder="Search sequences…"
      primaryAction={{ label: "Create Sequence", icon: Plus }}
    >
      <SequencesContent />
    </EmailModuleShell>
  );
}
