"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ApprovePayoutButton({ payoutId }: { payoutId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function approve() {
    setLoading(true);
    await fetch("/api/v1/payouts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payoutId }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <Button size="sm" onClick={approve} disabled={loading}>
      Approve
    </Button>
  );
}
