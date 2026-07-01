"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, Loader2, MousePointerClick } from "lucide-react";
import { EmailSubNav } from "./email-sub-nav";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Send = {
  id: string;
  status: string;
  sentAt: string | null;
  scheduledAt: string;
  hasOpen: boolean;
  hasClick: boolean;
  contact: { email: string; firstName: string | null };
  automation: { name: string } | null;
  template: { subject: string };
};

export function EmailActivityPanel() {
  const [sends, setSends] = useState<Send[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/v1/advertiser/email/sends?limit=50");
    const json = await res.json();
    setSends(json.data?.items ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <EmailSubNav />
      <p className="text-sm text-slate-600">Recent email sends with delivery and engagement status.</p>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contact</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Automation</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Engagement</TableHead>
                <TableHead>Sent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sends.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.contact.email}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{s.template.subject}</TableCell>
                  <TableCell>{s.automation?.name ?? "—"}</TableCell>
                  <TableCell><Badge variant="secondary">{s.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {s.hasOpen && <Eye className="h-4 w-4 text-green-600" aria-label="Opened" />}
                      {s.hasClick && <MousePointerClick className="h-4 w-4 text-blue-600" aria-label="Clicked" />}
                      {!s.hasOpen && !s.hasClick && <span className="text-slate-400">—</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {s.sentAt ? new Date(s.sentAt).toLocaleString() : new Date(s.scheduledAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
