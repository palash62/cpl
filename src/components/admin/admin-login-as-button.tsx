"use client";

import { useState } from "react";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminLoginAsButtonProps {
  userId: string;
  userName: string;
  disabled?: boolean;
}

export function AdminLoginAsButton({ userId, userName, disabled }: AdminLoginAsButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error?.message ?? "Unable to start impersonation");
        setLoading(false);
        return;
      }

      const startUrl = new URL("/api/v1/admin/impersonate/start", window.location.origin);
      startUrl.searchParams.set("token", data.data.token);
      startUrl.searchParams.set("redirectTo", data.data.redirectTo);

      window.open(startUrl.toString(), "_blank", "noopener,noreferrer");
      setLoading(false);
    } catch {
      setError("Unable to start impersonation");
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 gap-1"
        disabled={disabled || loading}
        onClick={handleLogin}
        title={`Open ${userName} panel in new tab`}
      >
        <LogIn className="h-3.5 w-3.5" />
        {loading ? "Opening…" : "Login"}
      </Button>
      {error && <p className="max-w-[12rem] text-right text-xs text-red-600">{error}</p>}
    </div>
  );
}
