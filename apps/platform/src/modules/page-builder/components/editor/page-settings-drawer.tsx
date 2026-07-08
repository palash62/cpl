"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBuilderStore } from "@/modules/page-builder/lib/builder-store";
import { getBuilderChrome } from "@/modules/page-builder/lib/builder-chrome";
import { cn } from "@/lib/utils";

export function PageSettingsDrawer() {
  const open = useBuilderStore((s) => s.pageSettingsOpen);
  const setOpen = useBuilderStore((s) => s.setPageSettingsOpen);
  const pageName = useBuilderStore((s) => s.pageName);
  const pageSlug = useBuilderStore((s) => s.pageSlug);
  const chrome = getBuilderChrome(useBuilderStore((s) => s.builderConfig.chromeTheme ?? "dark"));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className={cn("max-w-md", chromeThemeClass(chrome))}>
        <DialogHeader>
          <DialogTitle className={cn("text-base", chrome.propertiesTitle)}>Page settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Page name</Label>
            <Input value={pageName} readOnly className={inputClass(chrome)} />
          </div>
          <div className="space-y-1.5">
            <Label>Slug / URL path</Label>
            <Input value={pageSlug} readOnly className={inputClass(chrome)} />
          </div>
          <div className="space-y-1.5">
            <Label>SEO title</Label>
            <Input placeholder="Page title for search engines" className={inputClass(chrome)} />
          </div>
          <div className="space-y-1.5">
            <Label>Meta description</Label>
            <textarea
              className={cn("min-h-[80px] w-full rounded-md border px-3 py-2 text-sm", inputClass(chrome))}
              placeholder="Short description for search results"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Custom head scripts</Label>
            <textarea
              className={cn("min-h-[80px] w-full rounded-md border px-3 py-2 font-mono text-xs", inputClass(chrome))}
              placeholder="<!-- tracking pixels, etc. -->"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function chromeThemeClass(chrome: ReturnType<typeof getBuilderChrome>) {
  return chrome.properties.includes("bg-[#12141c]")
    ? "border-white/10 bg-[#12141c] text-slate-200"
    : "border-slate-200 bg-white text-slate-900";
}

function inputClass(chrome: ReturnType<typeof getBuilderChrome>) {
  return chrome.properties.includes("bg-[#12141c]")
    ? "border-white/20 bg-white/10 text-slate-100 placeholder:text-slate-400"
    : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400";
}
