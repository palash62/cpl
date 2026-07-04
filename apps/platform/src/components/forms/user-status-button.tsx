"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { UserStatus } from "@prisma/client";

export function UserStatusButton({
  userId,
  currentStatus,
}: {
  userId: string;
  currentStatus: UserStatus;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const nextStatus: UserStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
  const label = currentStatus === "ACTIVE" ? "Suspend" : "Activate";

  async function toggle() {
    setLoading(true);
    await fetch("/api/v1/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, status: nextStatus }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <Button size="sm" variant={currentStatus === "ACTIVE" ? "outline" : "default"} onClick={toggle} disabled={loading}>
      {label}
    </Button>
  );
}
