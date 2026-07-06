"use client";

import type { SerializedOptinFunnel } from "@/lib/optin-funnel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type FunnelSettingsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  funnel: SerializedOptinFunnel;
  thankYouEnabled: boolean;
  destinationUrl: string;
  thankYouPixelHtml: string;
  thankYouUseCampaignPixel: boolean;
  saving: boolean;
  message: string | null;
  onThankYouEnabledChange: (enabled: boolean) => void;
  onDestinationUrlChange: (url: string) => void;
  onThankYouPixelHtmlChange: (html: string) => void;
  onThankYouUseCampaignPixelChange: (enabled: boolean) => void;
  onSave: () => void;
};

export function FunnelSettingsSheet({
  open,
  onOpenChange,
  funnel,
  thankYouEnabled,
  destinationUrl,
  thankYouPixelHtml,
  thankYouUseCampaignPixel,
  saving,
  message,
  onThankYouEnabledChange,
  onDestinationUrlChange,
  onThankYouPixelHtmlChange,
  onThankYouUseCampaignPixelChange,
  onSave,
}: FunnelSettingsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Funnel settings</SheetTitle>
          <SheetDescription>Configure thank-you redirect, tracking, and post-submit behavior.</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            <p className="font-medium text-slate-900">{funnel.name}</p>
            <p className="mt-1 font-mono text-xs">/o/{funnel.slug}</p>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={thankYouEnabled}
              disabled={saving}
              onChange={(e) => onThankYouEnabledChange(e.target.checked)}
            />
            Redirect after submit to thank-you page
          </label>

          {!thankYouEnabled && (
            <div className="space-y-2">
              <Label>Destination URL (after submit)</Label>
              <Input
                type="url"
                value={destinationUrl}
                onChange={(e) => onDestinationUrlChange(e.target.value)}
                placeholder="https://example.com/thank-you"
              />
              <p className="text-xs text-slate-500">
                Used when thank-you page is off. Leave empty for an on-page success message.
              </p>
            </div>
          )}

          {thankYouEnabled && (
            <p className="text-xs text-slate-500">
              With thank-you enabled, visitors go to your thank-you step after submit.
            </p>
          )}

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={thankYouUseCampaignPixel}
              onChange={(e) => onThankYouUseCampaignPixelChange(e.target.checked)}
            />
            Fire campaign conversion pixel on thank-you page
          </label>

          <div className="space-y-2">
            <Label>Custom pixel / tracking code (HTML)</Label>
            <textarea
              value={thankYouPixelHtml}
              onChange={(e) => onThankYouPixelHtmlChange(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs"
              placeholder="<script>...</script>"
            />
          </div>

          <div className="flex items-center gap-3">
            <Button disabled={saving} onClick={onSave}>
              Save settings
            </Button>
            {message && (
              <p className={`text-sm ${message.includes("Unable") ? "text-red-600" : "text-emerald-600"}`}>
                {message}
              </p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
