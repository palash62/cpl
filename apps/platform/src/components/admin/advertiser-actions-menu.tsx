"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Eye,
  Send,
  CheckCircle,
  Ban,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminDeleteUserDialog } from "@/components/admin/admin-delete-user-dialog";
import type { UserStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

type AdvertiserForMenu = {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  emailVerified: boolean;
};

type AdvertiserActionsMenuProps = {
  advertiser: AdvertiserForMenu;
  deleteDisabledReason?: string;
};

export function AdvertiserActionsMenu({
  advertiser,
  deleteDisabledReason,
}: AdvertiserActionsMenuProps) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [statusLoading, setStatusLoading] = useState<UserStatus | null>(null);
  const [statusError, setStatusError] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [resendError, setResendError] = useState("");

  const status = advertiser.status;
  const canChangeStatus = !(status === "PENDING" && !advertiser.emailVerified);
  const canResend =
    !advertiser.emailVerified && status !== "SUSPENDED";

  async function updateStatus(next: UserStatus) {
    if (statusLoading || !canChangeStatus) return;
    setStatusLoading(next);
    setStatusError("");
    try {
      const res = await fetch("/api/v1/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: advertiser.id, status: next }),
        cache: "no-store",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setStatusError(data.error?.message ?? "Failed to update status");
        return;
      }
      router.refresh();
    } finally {
      setStatusLoading(null);
    }
  }

  async function resendVerification() {
    if (resendLoading || !canResend) return;
    setResendLoading(true);
    setResendError("");
    setResendSent(false);
    try {
      const res = await fetch(
        `/api/v1/admin/advertisers/${advertiser.id}/resend-verification`,
        { method: "POST", cache: "no-store" },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResendError(data.error?.message ?? "Failed to resend verification email");
        return;
      }
      setResendSent(true);
      router.refresh();
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              title="More actions"
            />
          }
        >
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="bottom">
          <DropdownMenuItem
            onClick={() => router.push(`/admin/advertisers/${advertiser.id}`)}
          >
            <Eye className="h-4 w-4" />
            View profile
          </DropdownMenuItem>

          {canResend && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={resendLoading}
                onClick={() => void resendVerification()}
              >
                <Send className="h-4 w-4 text-amber-700" />
                {resendLoading ? "Sending..." : "Resend verification"}
              </DropdownMenuItem>
            </>
          )}

          {canChangeStatus && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={status === "ACTIVE" || statusLoading !== null}
                onClick={() => void updateStatus("ACTIVE")}
                className={cn(status === "ACTIVE" && "opacity-40")}
              >
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                {statusLoading === "ACTIVE" ? "Activating..." : "Activate"}
              </DropdownMenuItem>

              <DropdownMenuItem
                disabled={status === "SUSPENDED" || statusLoading !== null}
                onClick={() => void updateStatus("SUSPENDED")}
                className={cn(status === "SUSPENDED" && "opacity-40")}
              >
                <Ban className="h-4 w-4 text-red-600" />
                {statusLoading === "SUSPENDED" ? "Blocking..." : "Block"}
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            variant="destructive"
            disabled={Boolean(deleteDisabledReason)}
            title={deleteDisabledReason}
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {(statusError || resendError) && (
        <p className="mt-1 text-right text-xs text-red-500">
          {statusError || resendError}
        </p>
      )}
      {resendSent && !resendError && (
        <p className="mt-1 text-right text-xs font-medium text-emerald-600">Sent</p>
      )}

      <AdminDeleteUserDialog
        userId={advertiser.id}
        userName={advertiser.name}
        role="ADVERTISER"
        disabledReason={deleteDisabledReason}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}
