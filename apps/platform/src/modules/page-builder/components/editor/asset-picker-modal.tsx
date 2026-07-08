"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useBuilderStore } from "@/modules/page-builder/lib/builder-store";
import { getBuilderChrome } from "@/modules/page-builder/lib/builder-chrome";
import { cn } from "@/lib/utils";

type AssetPickerProps = {
  onSelect?: (url: string) => void;
};

export function AssetPickerModal({ onSelect }: AssetPickerProps) {
  const open = useBuilderStore((s) => s.assetPickerOpen);
  const setOpen = useBuilderStore((s) => s.setAssetPickerOpen);
  const chrome = getBuilderChrome(useBuilderStore((s) => s.builderConfig.chromeTheme ?? "dark"));
  const [url, setUrl] = useState("");

  function apply() {
    if (url.trim()) {
      onSelect?.(url.trim());
      setOpen(false);
      setUrl("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className={cn("max-w-lg", chrome.properties.includes("bg-[#12141c]") ? "border-white/10 bg-[#12141c]" : "border-slate-200 bg-white")}>
        <DialogHeader>
          <DialogTitle className={cn(chrome.propertiesTitle)}>Asset library</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className={cn("text-sm", chrome.propertiesSubtitle)}>Paste an image URL or upload via your media host.</p>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className={cn(chrome.properties.includes("bg-[#12141c]") && "border-white/20 bg-white/10 text-slate-100")}
          />
          {url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="Preview" className={cn("max-h-40 rounded-md border object-contain", chrome.properties.includes("bg-[#12141c]") ? "border-white/10" : "border-slate-200")} />
          )}
          <Button type="button" onClick={apply} disabled={!url.trim()}>
            Use image
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
