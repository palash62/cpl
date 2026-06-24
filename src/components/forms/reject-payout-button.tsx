"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function RejectPayoutButton({ payoutId }: { payoutId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function reject() {
    setLoading(true);
    await fetch("/api/v1/payouts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payoutId, action: "reject", reason: "Rejected by admin" }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <Button size="sm" variant="outline" onClick={reject} disabled={loading}>
      Reject
    </Button>
  );
}
