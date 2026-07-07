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

type AssetPickerProps = {
  onSelect?: (url: string) => void;
};

export function AssetPickerModal({ onSelect }: AssetPickerProps) {
  const open = useBuilderStore((s) => s.assetPickerOpen);
  const setOpen = useBuilderStore((s) => s.setAssetPickerOpen);
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Asset library</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-slate-500">Paste an image URL or upload via your media host.</p>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
          />
          {url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="Preview" className="max-h-40 rounded-md border object-contain" />
          )}
          <Button type="button" onClick={apply} disabled={!url.trim()}>
            Use image
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
