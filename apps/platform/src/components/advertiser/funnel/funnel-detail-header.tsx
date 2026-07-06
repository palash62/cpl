"use client";

import { ArrowLeft, Settings, Share2 } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type FunnelDetailHeaderProps = {
  funnelName: string;
  onSettingsClick: () => void;
};

export function FunnelDetailHeader({ funnelName, onSettingsClick }: FunnelDetailHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <ButtonLink href="/advertiser/optin-funnels" variant="ghost" size="sm" className="shrink-0 text-slate-600">
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back
        </ButtonLink>
        <h1 className="truncate text-xl font-semibold text-slate-900">{funnelName}</h1>
      </div>
      <TooltipProvider>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 opacity-50"
              disabled
            >
              <Share2 className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent>Coming soon</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
              onClick={onSettingsClick}
            >
              <Settings className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent>Funnel settings</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  );
}
