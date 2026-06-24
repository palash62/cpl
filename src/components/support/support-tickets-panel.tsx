"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export function SupportTicketsPanel({ isAdmin = false }: { isAdmin?: boolean }) {
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

  if (loading) return <p className="text-muted-foreground">Loading tickets...</p>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">New Ticket</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={createTicket} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} required />
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
              <Input id="body" value={body} onChange={(e) => setBody(e.target.value)} required />
            </div>
            <Button type="submit">Submit Ticket</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{isAdmin ? "All Tickets" : "My Tickets"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {tickets.map((t) => (
            <div key={t.id} className="flex items-center justify-between border-b py-3 last:border-0">
              <div>
                <p className="font-medium">{t.subject}</p>
                {isAdmin && t.user && (
                  <p className="text-xs text-muted-foreground">
                    {t.user.name} · {t.user.email} · {t.user.role}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{t.category}</Badge>
                <Badge>{t.status}</Badge>
              </div>
            </div>
          ))}
          {tickets.length === 0 && <p className="text-muted-foreground">No tickets yet</p>}
        </CardContent>
      </Card>
    </div>
  );
}
