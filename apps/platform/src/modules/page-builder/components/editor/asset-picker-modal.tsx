"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor } from "@craftjs/core";
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
import { toast } from "sonner";

type AssetPickerProps = {
  onSelect?: (url: string) => void;
};

export function AssetPickerModal({ onSelect }: AssetPickerProps) {
  const open = useBuilderStore((s) => s.assetPickerOpen);
  const setOpen = useBuilderStore((s) => s.setAssetPickerOpen);
  const chrome = getBuilderChrome(useBuilderStore((s) => s.builderConfig.chromeTheme ?? "dark"));
  const { actions, query } = useEditor();
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const isDark = chrome.properties.includes("bg-[#12141c]");

  useEffect(() => {
    if (!open) {
      setUrl("");
      setUploading(false);
    }
  }, [open]);

  function applyUrl(nextUrl: string) {
    const trimmed = nextUrl.trim();
    if (!trimmed) return;

    if (onSelect) {
      onSelect(trimmed);
    } else {
      const selectedId = query.getEvent("selected").first();
      if (selectedId) {
        actions.setProp(selectedId, (props: { src?: string }) => {
          props.src = trimmed;
        });
      }
    }

    setOpen(false);
    setUrl("");
  }

  function apply() {
    applyUrl(url);
  }

  async function handleFileChange(file: File | null) {
    if (!file) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/v1/builder/assets", {
        method: "POST",
        body,
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error?.message ?? "Upload failed");
      }
      const uploadedUrl = payload?.data?.url as string | undefined;
      if (!uploadedUrl) throw new Error("Upload failed");
      applyUrl(uploadedUrl);
      toast.success("Image uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className={cn(
          "max-w-lg",
          isDark ? "border-white/10 bg-[#12141c]" : "border-slate-200 bg-white",
        )}
      >
        <DialogHeader>
          <DialogTitle className={cn(chrome.propertiesTitle)}>Image</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <p className={cn("text-sm font-medium", chrome.propertiesTitle)}>Upload from device</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
              className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-blue-700"
              disabled={uploading}
              onChange={(e) => void handleFileChange(e.target.files?.[0] ?? null)}
            />
            <p className={cn("text-xs", chrome.propertiesSubtitle)}>
              JPEG, PNG, WebP, GIF, or SVG up to 5MB.
            </p>
          </div>

          <div className={cn("h-px", isDark ? "bg-white/10" : "bg-slate-200")} />

          <div className="space-y-2">
            <p className={cn("text-sm font-medium", chrome.propertiesTitle)}>Or paste image URL</p>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className={cn(isDark && "border-white/20 bg-white/10 text-slate-100")}
            />
            {url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={url}
                alt="Preview"
                className={cn(
                  "max-h-40 rounded-md border object-contain",
                  isDark ? "border-white/10" : "border-slate-200",
                )}
              />
            ) : null}
            <Button type="button" onClick={apply} disabled={!url.trim() || uploading}>
              Use image URL
            </Button>
          </div>

          {uploading ? (
            <p className={cn("text-xs", chrome.propertiesSubtitle)}>Uploading…</p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
