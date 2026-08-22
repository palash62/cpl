"use client";

import { formatUserDateTime } from "@/lib/user-timezone";
import { useSession } from "next-auth/react";
import { Headphones, Pencil, Send, Trash2, User } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { isStaffSupportRole } from "@/lib/support-tickets";
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
  allowReply?: boolean;
  closedMessage?: string;
  hideReplyTrigger?: boolean;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  secondaryActionLoading?: boolean;
  secondaryActionDisabled?: boolean;
  secondaryActionIcon?: React.ReactNode;
  allowMessageManagement?: boolean;
  onEditMessage?: (messageId: string, body: string) => void | Promise<boolean>;
  onDeleteMessage?: (messageId: string) => void;
  managingMessageId?: string | null;
  editSaving?: boolean;
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
  allowReply = true,
  closedMessage = "This ticket is closed. No further replies can be sent.",
  hideReplyTrigger = false,
  secondaryActionLabel,
  onSecondaryAction,
  secondaryActionLoading = false,
  secondaryActionDisabled = false,
  secondaryActionIcon,
  allowMessageManagement = false,
  onEditMessage,
  onDeleteMessage,
  managingMessageId = null,
  editSaving = false,
}: TicketConversationProps) {
  const { data: session } = useSession();
  const showSecondaryAction = Boolean(secondaryActionLabel && onSecondaryAction);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  function startEdit(message: TicketMessageItem) {
    setEditingMessageId(message.id);
    setEditDraft(message.body);
  }

  function cancelEdit() {
    setEditingMessageId(null);
    setEditDraft("");
  }

  function saveEdit(messageId: string) {
    if (!editDraft.trim() || !onEditMessage) return;
    void (async () => {
      const ok = await onEditMessage(messageId, editDraft.trim());
      if (ok !== false) {
        cancelEdit();
      }
    })();
  }

  return (
    <div className="space-y-4">
      {messages.length > 0 ? (
        <div className="space-y-3">
          {messages.map((message) => {
            const isStaff = isStaffSupportRole(message.sender?.role);
            const isEditing = editingMessageId === message.id;
            const isBusy = managingMessageId === message.id && editSaving;

            return (
              <div
                key={message.id}
                className={cn(
                  "rounded-xl border p-4",
                  isStaff
                    ? "border-[color-mix(in_srgb,var(--theme-primary)_25%,transparent)] bg-[var(--theme-primary-soft)]"
                    : "border-slate-200 bg-white",
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                      isStaff ? "bg-white text-[var(--theme-primary)]" : "bg-slate-100 text-slate-600",
                    )}
                  >
                    {isStaff ? <Headphones className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {isStaff ? "Support Team" : (message.sender?.name ?? "You")}
                        </p>
                        {isStaff && message.sender?.name && (
                          <p className="text-xs text-slate-500">{message.sender.name}</p>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">
                        {formatUserDateTime(message.createdAt, session?.user?.timezone, "MMM d, yyyy HH:mm")}
                      </p>
                    </div>
                    {isEditing ? (
                      <div className="mt-3 space-y-2">
                        <textarea
                          value={editDraft}
                          onChange={(e) => setEditDraft(e.target.value)}
                          rows={3}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[var(--theme-primary)]/15"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            disabled={isBusy || !editDraft.trim()}
                            onClick={() => saveEdit(message.id)}
                          >
                            {isBusy ? "Saving..." : "Save"}
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit} disabled={isBusy}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                          {message.body}
                        </p>
                        {allowMessageManagement && isStaff && onEditMessage && onDeleteMessage && (
                          <div className="mt-3 flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 gap-1 px-2 text-xs"
                              onClick={() => startEdit(message)}
                            >
                              <Pencil className="h-3 w-3" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 gap-1 px-2 text-xs text-red-700 hover:border-red-200 hover:bg-red-50"
                              disabled={managingMessageId === message.id && editSaving}
                              onClick={() => {
                                if (window.confirm("Delete this reply?")) {
                                  onDeleteMessage(message.id);
                                }
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-slate-500">{emptyMessage}</p>
      )}

      {allowReply ? (
        showReplyForm ? (
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
        ) : hideReplyTrigger ? null : (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={onStartReply}>
              Reply
            </Button>
            {showSecondaryAction && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 border-slate-300 text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                disabled={secondaryActionDisabled || secondaryActionLoading}
                onClick={onSecondaryAction}
              >
                {secondaryActionIcon}
                {secondaryActionLoading ? "Closing..." : secondaryActionLabel}
              </Button>
            )}
          </div>
        )
      ) : (
        <p className="text-sm text-slate-500">{closedMessage}</p>
      )}
    </div>
  );
}
