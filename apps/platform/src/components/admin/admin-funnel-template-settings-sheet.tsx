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

type AdminTemplateSettingsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateName: string;
  templateSlug: string;
  thankYouEnabled: boolean;
  destinationUrl: string;
  thankYouPixelHtml: string;
  saving: boolean;
  message: string | null;
  onThankYouEnabledChange: (enabled: boolean) => void;
  onDestinationUrlChange: (url: string) => void;
  onThankYouPixelHtmlChange: (html: string) => void;
  onSave: () => void;
};

export function AdminFunnelTemplateSettingsSheet({
  open,
  onOpenChange,
  templateName,
  templateSlug,
  thankYouEnabled,
  destinationUrl,
  thankYouPixelHtml,
  saving,
  message,
  onThankYouEnabledChange,
  onDestinationUrlChange,
  onThankYouPixelHtmlChange,
  onSave,
}: AdminTemplateSettingsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto border-l border-slate-200 bg-white sm:max-w-md">
        <SheetHeader className="border-b border-slate-100 pb-4">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Settings2 className="h-4 w-4 text-blue-600" />
            Funnel settings
          </SheetTitle>
          <SheetDescription>Configure submit behavior and tracking for this template.</SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-900">{templateName}</p>
            <p className="mt-1 font-mono text-xs text-slate-500">/o/{templateSlug}</p>
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
                  Enable this if leads should land on your thank-you step after submit.
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
                  Required when thank-you redirect is off.
                </p>
              </div>
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
