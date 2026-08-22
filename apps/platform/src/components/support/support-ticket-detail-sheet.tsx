"use client";

import { formatUserDateTime } from "@/lib/user-timezone";
import { useSession } from "next-auth/react";
import { LifeBuoy, Users, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  TicketConversation,
  type TicketMessageItem,
} from "@/components/support/ticket-conversation";
import {
  formatTicketStatus,
  SUPPORT_CATEGORY_LABELS,
  SUPPORT_STATUS_STYLES,
} from "@/lib/support-tickets";

export type SupportTicketDetail = {
  id: string;
  subject: string;
  category: string;
  status: string;
  createdAt: string;
  user?: { name: string; email: string; role: string };
  messages?: TicketMessageItem[];
};

type SupportTicketDetailSheetProps = {
  ticket: SupportTicketDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant: "user" | "admin";
  replyBody: string;
  onReplyBodyChange: (value: string) => void;
  showReplyForm: boolean;
  onStartReply: () => void;
  onCancelReply: () => void;
  onSendReply: () => void;
  sendingReply: boolean;
  replyError?: string | null;
  closeError?: string | null;
  onCloseTicket?: () => void;
  closingTicket?: boolean;
  allowMessageManagement?: boolean;
  onEditMessage?: (messageId: string, body: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  managingMessageId?: string | null;
  editSaving?: boolean;
};

export function SupportTicketDetailSheet({
  ticket,
  open,
  onOpenChange,
  variant,
  replyBody,
  onReplyBodyChange,
  showReplyForm,
  onStartReply,
  onCancelReply,
  onSendReply,
  sendingReply,
  replyError,
  closeError,
  onCloseTicket,
  closingTicket = false,
  allowMessageManagement = false,
  onEditMessage,
  onDeleteMessage,
  managingMessageId = null,
  editSaving = false,
}: SupportTicketDetailSheetProps) {
  const { data: session } = useSession();
  const isClosed = ticket?.status === "CLOSED";
  const isAdmin = variant === "admin";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col overflow-hidden border-l border-slate-200 bg-white p-0 sm:max-w-lg">
        <SheetHeader className="shrink-0 border-b border-slate-100 px-6 py-4">
          <SheetTitle className="flex items-start gap-2 pr-6 text-base leading-snug">
            <LifeBuoy className="mt-0.5 h-4 w-4 shrink-0 text-[var(--theme-primary)]" />
            <span>{ticket?.subject ?? "Support ticket"}</span>
          </SheetTitle>
          {ticket && (
            <SheetDescription asChild>
              <div className="space-y-2 pt-1 text-left">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700">
                    {SUPPORT_CATEGORY_LABELS[ticket.category] ?? ticket.category}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={
                      SUPPORT_STATUS_STYLES[ticket.status] ??
                      "border-slate-200 bg-slate-50 text-slate-600"
                    }
                  >
                    {formatTicketStatus(ticket.status)}
                  </Badge>
                </div>
                {isAdmin && ticket.user && (
                  <p className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Users className="h-3.5 w-3.5" />
                    {ticket.user.name} · {ticket.user.email} · {ticket.user.role}
                  </p>
                )}
                <p className="text-xs text-slate-400">
                  Opened{" "}
                  {formatUserDateTime(ticket.createdAt, session?.user?.timezone, "MMM d, yyyy HH:mm")}
                </p>
              </div>
            </SheetDescription>
          )}
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {closeError && (
            <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {closeError}
            </p>
          )}
          {replyError && (
            <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {replyError}
            </p>
          )}
          {ticket && (
            <TicketConversation
              messages={ticket.messages ?? []}
              replyBody={replyBody}
              onReplyBodyChange={onReplyBodyChange}
              onSendReply={onSendReply}
              onCancelReply={onCancelReply}
              showReplyForm={showReplyForm}
              onStartReply={onStartReply}
              sendingReply={sendingReply}
              replyLabel={isAdmin ? "Admin reply to user" : "Add a follow-up message"}
              allowReply={!isClosed}
              closedMessage={isAdmin ? "This ticket is closed." : "This ticket is closed. No further replies can be sent."}
              hideReplyTrigger={isAdmin}
              allowMessageManagement={allowMessageManagement}
              onEditMessage={onEditMessage}
              onDeleteMessage={onDeleteMessage}
              managingMessageId={managingMessageId}
              editSaving={editSaving}
            />
          )}
        </div>

        {ticket && isAdmin && !isClosed && (
          <div className="flex shrink-0 flex-wrap gap-2 border-t border-slate-200 px-6 py-4">
            <Button size="sm" variant="outline" onClick={onStartReply}>
              Reply
            </Button>
            {onCloseTicket && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 border-slate-300 text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                disabled={closingTicket}
                onClick={onCloseTicket}
              >
                <XCircle className="h-3.5 w-3.5" />
                {closingTicket ? "Closing..." : "Close Ticket"}
              </Button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
