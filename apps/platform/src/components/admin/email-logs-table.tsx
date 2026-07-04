"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

type EmailLogRow = {
  id: string;
  to: string;
  template: string;
  subject: string;
  status: string;
  error: string | null;
  createdAt: string;
};

export function EmailLogsTable() {
  const [logs, setLogs] = useState<EmailLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/v1/admin/email/logs?limit=15")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load email logs");
        const data = await res.json();
        setLogs(data.data ?? []);
      })
      .catch(() => setError("Could not load email logs."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-sm text-slate-500">Loading email log...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (logs.length === 0) {
    return <p className="text-sm text-slate-500">No emails logged yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Time</th>
            <th className="px-4 py-3">To</th>
            <th className="px-4 py-3">Template</th>
            <th className="px-4 py-3">Subject</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-t border-slate-100">
              <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                {new Date(log.createdAt).toLocaleString()}
              </td>
              <td className="px-4 py-3">{log.to}</td>
              <td className="px-4 py-3">{log.template}</td>
              <td className="px-4 py-3 max-w-xs truncate" title={log.subject}>
                {log.subject}
              </td>
              <td className="px-4 py-3">
                <Badge
                  variant={
                    log.status === "sent"
                      ? "default"
                      : log.status === "failed"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {log.status}
                </Badge>
                {log.error && (
                  <p className="mt-1 text-xs text-red-600" title={log.error}>
                    {log.error}
                  </p>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
