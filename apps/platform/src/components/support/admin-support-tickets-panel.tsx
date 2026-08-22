"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Clock, LifeBuoy, MessageSquare, Ticket, XCircle } from "lucide-react";
import { GradientStatCard, NeutralStatCard } from "@/components/admin/gradient-stat-card";
import { PageSection } from "@/components/admin/page-section";
import { avatarColors, getInitials } from "@/components/admin/admin-ui";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  SupportTicketDetailSheet,
  type SupportTicketDetail,
} from "@/components/support/support-ticket-detail-sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatTicketStatus,
  SUPPORT_CATEGORY_LABELS,
  SUPPORT_STATUS_STYLES,
  truncateTicketMessage,
} from "@/lib/support-tickets";
import { cn } from "@/lib/utils";

export function AdminSupportTicketsPanel() {
  const [tickets, setTickets] = useState<SupportTicketDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [managingMessageId, setManagingMessageId] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) ?? null;

  const stats = useMemo(() => {
    const open = tickets.filter((t) => t.status === "OPEN").length;
    const inProgress = tickets.filter((t) => t.status === "IN_PROGRESS").length;
    const closed = tickets.filter((t) => t.status === "CLOSED").length;
    return { total: tickets.length, open, inProgress, closed };
  }, [tickets]);

  function applyTicketUpdate(updated: SupportTicketDetail) {
    setTickets((current) => current.map((t) => (t.id === updated.id ? updated : t)));
  }

  async function load() {
    setLoadError(null);
    const res = await fetch("/api/v1/support/tickets");
    const data = await res.json();
    if (!res.ok) {
      setLoadError(data?.error?.message ?? "Unable to load support tickets");
      setLoading(false);
      return;
    }
    setTickets(data.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  function openTicket(ticketId: string) {
    setSelectedTicketId(ticketId);
    setSheetOpen(true);
    setShowReplyForm(false);
    setReplyBody("");
    setReplyError(null);
    setCloseError(null);
  }

  function closeSheet() {
    setSheetOpen(false);
    setSelectedTicketId(null);
    setShowReplyForm(false);
    setReplyBody("");
    setReplyError(null);
    setCloseError(null);
  }

  async function sendReply() {
    if (!selectedTicketId || !replyBody.trim()) return;
    setSending(true);
    setReplyError(null);

    const res = await fetch("/api/v1/support/tickets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId: selectedTicketId, body: replyBody.trim() }),
    });
    const data = await res.json();

    setSending(false);

    if (!res.ok) {
      setReplyError(data?.error?.message ?? "Unable to send reply");
      return;
    }

    if (data.data) {
      applyTicketUpdate(data.data as SupportTicketDetail);
    }
    setReplyBody("");
    setShowReplyForm(false);
  }

  async function closeTicket() {
    if (!selectedTicketId) return;
    if (!window.confirm("Close this support ticket? The user will be notified.")) {
      return;
    }

    setClosing(true);
    setCloseError(null);

    const res = await fetch("/api/v1/support/tickets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId: selectedTicketId, action: "close" }),
    });
    const data = await res.json();

    setClosing(false);

    if (!res.ok) {
      setCloseError(data?.error?.message ?? "Unable to close ticket");
      return;
    }

    if (data.data) {
      applyTicketUpdate(data.data as SupportTicketDetail);
    }
    setShowReplyForm(false);
    setReplyBody("");
    setReplyError(null);
  }

  async function editMessage(messageId: string, body: string): Promise<boolean> {
    setManagingMessageId(messageId);
    setEditSaving(true);
    setReplyError(null);

    const res = await fetch("/api/v1/support/tickets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "editMessage", messageId, body }),
    });
    const data = await res.json();

    setEditSaving(false);
    setManagingMessageId(null);

    if (!res.ok) {
      setReplyError(data?.error?.message ?? "Unable to edit reply");
      return false;
    }

    if (data.data) {
      applyTicketUpdate(data.data as SupportTicketDetail);
    }
    return true;
  }

  async function deleteMessage(messageId: string) {
    setManagingMessageId(messageId);
    setEditSaving(true);
    setReplyError(null);

    const res = await fetch("/api/v1/support/tickets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deleteMessage", messageId }),
    });
    const data = await res.json();

    setEditSaving(false);
    setManagingMessageId(null);

    if (!res.ok) {
      setReplyError(data?.error?.message ?? "Unable to delete reply");
      return;
    }

    if (data.data) {
      applyTicketUpdate(data.data as SupportTicketDetail);
    }
  }

  if (loading) {
    return <p className="text-slate-500">Loading tickets...</p>;
  }

  return (
    <div className="space-y-7">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <GradientStatCard variant="leads" label="All Tickets" value={stats.total} icon={Ticket} />
        <NeutralStatCard label="Open" value={stats.open} icon={MessageSquare} accent="orange" />
        <NeutralStatCard label="In Progress" value={stats.inProgress} icon={Clock} accent="purple" />
        <NeutralStatCard label="Closed" value={stats.closed} icon={XCircle} accent="green" />
      </div>

      <PageSection
        title="All Tickets"
        description="Click a ticket to view the conversation and reply"
        icon={LifeBuoy}
        gradient="approved"
        contentClassName="overflow-visible"
      >
        {loadError && (
          <p className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {loadError}
          </p>
        )}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow
                className="border-none hover:bg-transparent"
                style={{ background: "var(--theme-primary-soft)" }}
              >
                <TableHead className="h-11 w-10 px-4" />
                <TableHead className="h-11 px-4 text-slate-600">User</TableHead>
                <TableHead className="h-11 px-4 text-slate-600">Subject</TableHead>
                <TableHead className="h-11 px-4 text-slate-600">Category</TableHead>
                <TableHead className="h-11 px-4 text-slate-600">Status</TableHead>
                <TableHead className="h-11 px-4 text-slate-600">Last Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="px-6 py-16 text-center text-slate-500">
                    No support tickets yet
                  </TableCell>
                </TableRow>
              ) : (
                tickets.map((ticket, index) => {
                  const lastMessage = ticket.messages?.[ticket.messages.length - 1];

                  return (
                    <TableRow
                      key={ticket.id}
                      className="cursor-pointer border-slate-100 transition-colors hover:bg-blue-50/40"
                      onClick={() => openTicket(ticket.id)}
                    >
                      <TableCell className="px-4 py-4">
                        <ChevronRight className="h-4 w-4 text-slate-500" />
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        {ticket.user && (
                          <div className="flex items-center gap-3">
                            <Avatar size="sm">
                              <AvatarFallback
                                className={cn(
                                  "text-xs font-semibold",
                                  avatarColors[index % avatarColors.length],
                                )}
                              >
                                {getInitials(ticket.user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium text-slate-900">{ticket.user.name}</p>
                              <p className="text-xs text-slate-500">{ticket.user.email}</p>
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-4 font-medium text-slate-900">
                        {ticket.subject}
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700">
                          {SUPPORT_CATEGORY_LABELS[ticket.category] ?? ticket.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <Badge
                          variant="outline"
                          className={
                            SUPPORT_STATUS_STYLES[ticket.status] ??
                            "border-slate-200 bg-slate-50 text-slate-600"
                          }
                        >
                          {formatTicketStatus(ticket.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs px-4 py-4 text-sm text-slate-600">
                        {lastMessage ? truncateTicketMessage(lastMessage.body, 60) : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </PageSection>

      <SupportTicketDetailSheet
        ticket={selectedTicket}
        open={sheetOpen}
        onOpenChange={(open) => {
          if (!open) closeSheet();
          else setSheetOpen(true);
        }}
        variant="admin"
        replyBody={replyBody}
        onReplyBodyChange={setReplyBody}
        showReplyForm={showReplyForm}
        onStartReply={() => {
          setShowReplyForm(true);
          setReplyBody("");
          setReplyError(null);
        }}
        onCancelReply={() => {
          setShowReplyForm(false);
          setReplyBody("");
          setReplyError(null);
        }}
        onSendReply={() => void sendReply()}
        sendingReply={sending}
        replyError={replyError}
        closeError={closeError}
        onCloseTicket={() => void closeTicket()}
        closingTicket={closing}
        allowMessageManagement
        onEditMessage={(messageId, body) => void editMessage(messageId, body)}
        onDeleteMessage={(messageId) => void deleteMessage(messageId)}
        managingMessageId={managingMessageId}
        editSaving={editSaving}
      />
    </div>
  );
}
