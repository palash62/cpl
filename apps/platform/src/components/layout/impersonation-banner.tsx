"use client";

import { useState } from "react";
import { ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImpersonationBannerProps {
  userName: string;
  userRole: string;
}

export function ImpersonationBanner({ userName, userRole }: ImpersonationBannerProps) {
  const [loading, setLoading] = useState(false);

  async function handleExit() {
    setLoading(true);
    try {
      await fetch("/api/v1/admin/impersonate/stop", { method: "POST" });
      window.close();
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 border-b border-amber-300 bg-amber-50 px-4 py-2.5 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6">
      <div className="flex items-start gap-2 sm:items-center">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 sm:mt-0" />
        <span>
          Admin view: <strong>{userName}</strong> ({userRole.toLowerCase()}) — close this tab when
          done
        </span>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 w-full shrink-0 gap-1 border-amber-300 bg-white hover:bg-amber-100 sm:w-auto"
        disabled={loading}
        onClick={handleExit}
      >
        <X className="h-3.5 w-3.5" />
        Close panel
      </Button>
    </div>
  );
}
