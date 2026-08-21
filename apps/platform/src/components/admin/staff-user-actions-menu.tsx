"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, CheckCircle, Ban, Trash2 } from "lucide-react";
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

export function StaffUserActionsMenu({
  userId,
  userName,
  currentStatus,
  deleteDisabledReason,
}: {
  userId: string;
  userName: string;
  currentStatus: UserStatus;
  deleteDisabledReason?: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [statusLoading, setStatusLoading] = useState<"ACTIVE" | "SUSPENDED" | null>(null);
  const [statusError, setStatusError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    setStatus(currentStatus);
  }, [currentStatus, userId]);

  async function updateStatus(next: "ACTIVE" | "SUSPENDED") {
    if (status === next || statusLoading) return;
    setStatusLoading(next);
    setStatusError("");
    try {
      const res = await fetch(`/api/v1/admin/staff-users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
        cache: "no-store",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setStatusError(data.error?.message ?? "Failed to update status");
        return;
      }
      setStatus(next);
      router.refresh();
    } finally {
      setStatusLoading(null);
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
            {statusLoading === "SUSPENDED" ? "Setting inactive..." : "Set inactive"}
          </DropdownMenuItem>

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
      {statusError ? (
        <p className="mt-1 text-right text-xs text-red-500">{statusError}</p>
      ) : null}

      <AdminDeleteUserDialog
        userId={userId}
        userName={userName}
        role="PLATFORM_MANAGER"
        disabledReason={deleteDisabledReason}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}
