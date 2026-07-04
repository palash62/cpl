"use client";

import { format } from "date-fns";
import { Headphones, Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface TicketMessageItem {
  id: string;
  body: string;
  createdAt: string;
  sender?: { name: string; role: string };
}

interface TicketConversationProps {
  messages: TicketMessageItem[];
  replyBody: string;
  onReplyBodyChange: (value: string) => void;
  onSendReply: () => void;
  onCancelReply: () => void;
  showReplyForm: boolean;
  onStartReply: () => void;
  sendingReply: boolean;
  replyLabel?: string;
  emptyMessage?: string;
}

export function TicketConversation({
  messages,
  replyBody,
  onReplyBodyChange,
  onSendReply,
  onCancelReply,
  showReplyForm,
  onStartReply,
  sendingReply,
  replyLabel = "Add a follow-up message",
  emptyMessage = "No messages on this ticket.",
}: TicketConversationProps) {
  return (
    <div className="space-y-4">
      {messages.length > 0 ? (
        <div className="space-y-3">
          {messages.map((message) => {
            const isAdmin = message.sender?.role === "ADMIN";

            return (
              <div
                key={message.id}
                className={cn(
                  "rounded-xl border p-4",
                  isAdmin
                    ? "border-[color-mix(in_srgb,var(--theme-primary)_25%,transparent)] bg-[var(--theme-primary-soft)]"
                    : "border-slate-200 bg-white",
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                      isAdmin ? "bg-white text-[var(--theme-primary)]" : "bg-slate-100 text-slate-600",
                    )}
                  >
                    {isAdmin ? <Headphones className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {isAdmin ? "Support Team" : (message.sender?.name ?? "You")}
                        </p>
                        {isAdmin && message.sender?.name && (
                          <p className="text-xs text-slate-500">{message.sender.name}</p>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">
                        {format(new Date(message.createdAt), "MMM d, yyyy HH:mm")}
                      </p>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700">{message.body}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-slate-500">{emptyMessage}</p>
      )}

      {showReplyForm ? (
        <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
          <Label className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {replyLabel}
          </Label>
          <textarea
            value={replyBody}
            onChange={(e) => onReplyBodyChange(e.target.value)}
            rows={3}
            placeholder="Type your message..."
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[var(--theme-primary)]/15"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={onSendReply}
              disabled={sendingReply || !replyBody.trim()}
              className="gap-1 bg-[var(--theme-primary)] hover:opacity-90"
            >
              <Send className="h-3.5 w-3.5" />
              {sendingReply ? "Sending..." : "Send Reply"}
            </Button>
            <Button size="sm" variant="outline" onClick={onCancelReply}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="outline" onClick={onStartReply}>
          Reply
        </Button>
      )}
    </div>
  );
}
