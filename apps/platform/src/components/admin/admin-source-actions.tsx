"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminSourceActions({
  advertiserId,
  sourceToken,
  blocked,
}: {
  advertiserId: string;
  sourceToken: string;
  blocked: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleBlockToggle() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        blocked
          ? `/api/v1/admin/source-blocks?advertiserId=${encodeURIComponent(advertiserId)}&sourceToken=${encodeURIComponent(sourceToken)}`
          : "/api/v1/admin/source-blocks",
        {
          method: blocked ? "DELETE" : "POST",
          headers: blocked ? undefined : { "Content-Type": "application/json" },
          body: blocked
            ? undefined
            : JSON.stringify({ advertiserId, sourceToken }),
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error?.message ?? "Request failed");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {error && <span className="text-xs text-red-600">{error}</span>}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={loading}
        onClick={handleBlockToggle}
        className={
          blocked
            ? "h-8 gap-1 border-red-200 text-red-700 hover:bg-red-50"
            : "h-8 gap-1 border-slate-200 text-slate-600"
        }
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Ban className="h-3.5 w-3.5" />
        )}
        {blocked ? "Unblock" : "Block"}
      </Button>
    </div>
  );
}
