"use client";

import { useEffect, useState } from "react";
import { LifeBuoy, Send } from "lucide-react";
import { PageSection } from "@/components/admin/page-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TicketMessage {
  id: string;
  body: string;
  createdAt: string;
  sender?: { name: string; role: string };
}

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: string;
  createdAt: string;
  user?: { name: string; email: string; role: string };
  messages?: TicketMessage[];
}

const statusColors: Record<string, string> = {
  OPEN: "border-blue-200 bg-blue-50 text-blue-700",
  IN_PROGRESS: "border-amber-200 bg-amber-50 text-amber-700",
  RESOLVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CLOSED: "border-slate-200 bg-slate-50 text-slate-600",
};

export function AdminSupportTicketsPanel() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);

  async function load() {
    const res = await fetch("/api/v1/support/tickets");
    const data = await res.json();
    setTickets(data.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function sendReply(ticketId: string) {
    if (!replyBody.trim()) return;
    setSending(true);

    const res = await fetch("/api/v1/support/tickets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId, body: replyBody.trim() }),
    });

    setSending(false);

    if (res.ok) {
      setReplyBody("");
      setReplyingId(null);
      load();
    }
  }

  if (loading) return <p className="text-slate-500">Loading tickets...</p>;

  return (
    <PageSection
      title="All Tickets"
      description="Review user requests and send replies"
      icon={LifeBuoy}
      gradient="approved"
    >
      <div className="divide-y divide-slate-100">
        {tickets.map((t) => (
          <div key={t.id} className="px-6 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900">{t.subject}</p>
                {t.user && (
                  <p className="mt-0.5 text-xs text-slate-500">
                    {t.user.name} · {t.user.email} · {t.user.role}
                  </p>
                )}
                {t.messages?.[0] && (
                  <p className="mt-2 text-sm text-slate-600">
                    <span className="font-medium">{t.messages[0].sender?.name ?? "User"}:</span>{" "}
                    {t.messages[0].body}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700">
                  {t.category}
                </Badge>
                <Badge
                  variant="outline"
                  className={statusColors[t.status] ?? "border-slate-200 bg-slate-50 text-slate-600"}
                >
                  {t.status}
                </Badge>
              </div>
            </div>

            {replyingId === t.id ? (
              <div className="mt-4 space-y-2 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
                <Label htmlFor={`reply-${t.id}`} className="text-xs text-slate-500">
                  Admin reply
                </Label>
                <Input
                  id={`reply-${t.id}`}
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder="Type your reply..."
                  onKeyDown={(e) => e.key === "Enter" && sendReply(t.id)}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => sendReply(t.id)}
                    disabled={sending || !replyBody.trim()}
                    className="gap-1 bg-[var(--theme-primary)] hover:opacity-90"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {sending ? "Sending..." : "Send Reply"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setReplyingId(null);
                      setReplyBody("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => {
                  setReplyingId(t.id);
                  setReplyBody("");
                }}
              >
                Reply
              </Button>
            )}
          </div>
        ))}
        {tickets.length === 0 && (
          <p className="px-6 py-12 text-center text-slate-500">No tickets yet</p>
        )}
      </div>
    </PageSection>
  );
}
