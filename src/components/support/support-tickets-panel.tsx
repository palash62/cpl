"use client";

import { useEffect, useState } from "react";
import { LifeBuoy, MessageSquarePlus } from "lucide-react";
import { PageSection } from "@/components/admin/page-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: string;
  createdAt: string;
  user?: { name: string; email: string; role: string };
}

const statusColors: Record<string, string> = {
  OPEN: "border-blue-200 bg-blue-50 text-blue-700",
  IN_PROGRESS: "border-amber-200 bg-amber-50 text-amber-700",
  RESOLVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CLOSED: "border-slate-200 bg-slate-50 text-slate-600",
};

export function SupportTicketsPanel() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/v1/support/tickets");
    const data = await res.json();
    setTickets(data.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function createTicket(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/v1/support/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, category, body }),
    });
    setSubject("");
    setBody("");
    load();
  }

  if (loading) return <p className="text-slate-500">Loading tickets...</p>;

  return (
    <div className="space-y-6">
      <PageSection
        title="New Ticket"
        description="Submit a support request"
        icon={MessageSquarePlus}
        gradient="leads"
      >
        <form onSubmit={createTicket} className="space-y-4 p-6">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => v && setCategory(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GENERAL">General</SelectItem>
                <SelectItem value="BILLING">Billing</SelectItem>
                <SelectItem value="TECHNICAL">Technical</SelectItem>
                <SelectItem value="ACCOUNT">Account</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Input
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="bg-[var(--theme-primary)] hover:opacity-90">
            Submit Ticket
          </Button>
        </form>
      </PageSection>

      <PageSection title="My Tickets" description="Track your support requests" icon={LifeBuoy} gradient="approved">
        <div className="divide-y divide-slate-100">
          {tickets.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-blue-50/30">
              <div>
                <p className="font-medium text-slate-900">{t.subject}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700">
                  {t.category}
                </Badge>
                <Badge variant="outline" className={statusColors[t.status] ?? "border-slate-200 bg-slate-50 text-slate-600"}>
                  {t.status}
                </Badge>
              </div>
            </div>
          ))}
          {tickets.length === 0 && (
            <p className="px-6 py-12 text-center text-slate-500">No tickets yet</p>
          )}
        </div>
      </PageSection>
    </div>
  );
}
