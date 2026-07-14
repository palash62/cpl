"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AdminResendVerificationButton({
  userId,
  emailVerified,
  className,
}: {
  userId: string;
  userEmail?: string;
  emailVerified: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  if (emailVerified) return null;

  async function resend() {
    if (loading) return;

    setLoading(true);
    setError("");
    setSent(false);

    try {
      const res = await fetch(`/api/v1/admin/advertisers/${userId}/resend-verification`, {
        method: "POST",
        cache: "no-store",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error?.message ?? "Failed to resend verification email");
        return;
      }

      setSent(true);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn("flex flex-col items-start gap-1", className)}>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={loading}
        onClick={resend}
        title="Resend verification email"
        aria-label="Resend verification email"
        className="h-8 w-8 border-amber-200 p-0 text-amber-700 hover:bg-amber-50"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
      </Button>
      {sent && <p className="text-[11px] font-medium text-emerald-600">Sent</p>}
      {error && <p className="max-w-[140px] text-[11px] text-red-500">{error}</p>}
    </div>
  );
}
