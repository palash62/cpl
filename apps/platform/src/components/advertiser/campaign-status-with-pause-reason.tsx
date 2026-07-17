"use client";

import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CampaignStatusBadge } from "@/components/admin/admin-ui";

export function CampaignStatusWithPauseReason({
  status,
  pausedReason,
}: {
  status: string;
  pausedReason?: string | null;
}) {
  const reason =
    status === "PAUSED" ? (pausedReason?.trim() || "Paused") : null;

  return (
    <div className="inline-flex items-center gap-1.5">
      <CampaignStatusBadge status={status} />
      {reason ? (
        <TooltipProvider delay={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="inline-flex h-5 w-5 items-center justify-center rounded-full text-amber-600 hover:bg-amber-100 hover:text-amber-800"
                aria-label={`Pause reason: ${reason}`}
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs">
              {reason}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : null}
    </div>
  );
}
