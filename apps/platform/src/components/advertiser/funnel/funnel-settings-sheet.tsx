"use client";

import { Settings2 } from "lucide-react";
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
  entityName?: string;
  name?: string;
  onNameChange?: (value: string) => void;
  urlHint: string;
  description?: string;
  thankYouEnabled: boolean;
  destinationUrl: string;
  thankYouPixelHtml: string;
  saving: boolean;
  message: string | null;
  thankYouRedirectHint?: string;
  onThankYouEnabledChange: (enabled: boolean) => void;
  onDestinationUrlChange: (url: string) => void;
  onThankYouPixelHtmlChange: (html: string) => void;
  onSave: () => void;
};

export function FunnelSettingsSheet({
  open,
  onOpenChange,
  entityName,
  name,
  onNameChange,
  urlHint,
  description = "Configure submit behavior and tracking for this funnel.",
  thankYouEnabled,
  destinationUrl,
  thankYouPixelHtml,
  saving,
  message,
  thankYouRedirectHint,
  onThankYouEnabledChange,
  onDestinationUrlChange,
  onThankYouPixelHtmlChange,
  onSave,
}: FunnelSettingsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto border-l border-slate-200 bg-white sm:max-w-md">
        <SheetHeader className="border-b border-slate-100 pb-4">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Settings2 className="h-4 w-4 text-blue-600" />
            Funnel settings
          </SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            {onNameChange ? (
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-600">
                  Funnel name <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={name ?? ""}
                  onChange={(e) => onNameChange(e.target.value)}
                  placeholder="e.g. Sales funnel"
                  className="h-9 border-slate-200 bg-white text-sm"
                  disabled={saving}
                />
              </div>
            ) : (
              <p className="text-sm font-semibold text-slate-900">{entityName}</p>
            )}
            <p className="mt-2 font-mono text-xs text-slate-500">{urlHint}</p>
          </div>

          <div className="space-y-3 rounded-xl border border-slate-200 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">After submit</p>
            <label className="flex items-start gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={thankYouEnabled}
                disabled={saving}
                onChange={(e) => onThankYouEnabledChange(e.target.checked)}
                className="mt-0.5 accent-blue-600"
              />
              <span>
                Redirect to thank-you page
                <span className="mt-0.5 block text-xs text-slate-500">
                  Enable this if you want users to land on your thank-you step after form submit.
                </span>
              </span>
            </label>

            {!thankYouEnabled && (
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-600">
                  Destination URL <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="url"
                  required
                  value={destinationUrl}
                  onChange={(e) => onDestinationUrlChange(e.target.value)}
                  placeholder="https://example.com/thank-you"
                  className="h-9 border-slate-200 text-sm"
                />
                <p className="text-xs text-slate-500">
                  Required when thank-you redirect is off. Users go here after form submit.
                </p>
              </div>
            )}

            {thankYouEnabled && thankYouRedirectHint && (
              <p className="text-xs text-slate-500">{thankYouRedirectHint}</p>
            )}
          </div>

          <div className="space-y-2 rounded-xl border border-slate-200 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Tracking code</p>
            <Label className="text-xs font-medium text-slate-600">Custom pixel / HTML</Label>
            <textarea
              value={thankYouPixelHtml}
              onChange={(e) => onThankYouPixelHtmlChange(e.target.value)}
              rows={5}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs"
              placeholder="<script>...</script>"
            />
          </div>

          <div className="flex items-center gap-3 border-t border-slate-100 pt-3">
            <Button className="h-9" disabled={saving} onClick={onSave}>
              {saving ? "Saving..." : "Save settings"}
            </Button>
            {message && (
              <p className={`text-sm ${message.includes("Unable") || message.includes("required") || message.includes("valid") || message.includes("characters") ? "text-red-600" : "text-emerald-600"}`}>
                {message}
              </p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
