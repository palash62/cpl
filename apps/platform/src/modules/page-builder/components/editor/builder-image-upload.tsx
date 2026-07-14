"use client";

import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type BuilderImageUploadProps = {
  value?: string;
  onChange: (url: string) => void;
  onClear?: () => void;
  showUrlInput?: boolean;
  urlPlaceholder?: string;
  className?: string;
};

export function BuilderImageUpload({
  value = "",
  onChange,
  onClear,
  showUrlInput = true,
  urlPlaceholder = "Or paste image URL",
  className,
}: BuilderImageUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File | null) {
    if (!file) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/v1/builder/assets", {
        method: "POST",
        body,
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(payload?.error?.message ?? "Upload failed");
      }
      const uploadedUrl = payload?.data?.url as string | undefined;
      if (!uploadedUrl) throw new Error("Upload failed");
      onChange(uploadedUrl);
      toast.success("Image uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      {value?.trim() ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value.trim()}
          alt=""
          className="max-h-24 w-full rounded-md border border-slate-200 object-cover"
        />
      ) : null}

      <button
        type="button"
        disabled={uploading}
        onClick={() => fileRef.current?.click()}
        className={cn(
          "flex w-full min-h-[64px] flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed px-3 py-2.5 text-center transition",
          uploading
            ? "border-slate-200 bg-slate-50"
            : "border-blue-300 bg-blue-50/80 hover:border-blue-400 hover:bg-blue-50",
        )}
      >
        {uploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span className="text-[11px] font-medium text-slate-600">Uploading…</span>
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 text-blue-600" />
            <span className="text-[11px] font-semibold text-blue-700">Upload image</span>
          </>
        )}
      </button>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/*"
        disabled={uploading}
        className="block w-full cursor-pointer text-[11px] text-slate-600 file:mr-2 file:cursor-pointer file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-[11px] file:font-medium file:text-white hover:file:bg-blue-700"
        onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
      />

      {showUrlInput ? (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={urlPlaceholder}
          className="h-8 text-[11px]"
        />
      ) : null}

      {value && onClear ? (
        <Button type="button" size="sm" variant="ghost" className="h-8 text-xs text-red-600" onClick={onClear}>
          Remove image
        </Button>
      ) : null}
    </div>
  );
}
