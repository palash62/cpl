"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useBuilderStore } from "@/modules/page-builder/lib/builder-store";

type PreviewModalProps = { pageSlug: string };

export function PreviewModal({ pageSlug }: PreviewModalProps) {
  const open = useBuilderStore((s) => s.previewOpen);
  const setPreviewOpen = useBuilderStore((s) => s.setPreviewOpen);
  const publicPathPrefix = useBuilderStore((s) => s.builderConfig.publicPathPrefix);
  const previewPath = `${publicPathPrefix}${pageSlug}?preview=1`;

  return (
    <Dialog open={open} onOpenChange={setPreviewOpen}>
      <DialogContent className="max-w-5xl border-slate-200 bg-white">
        <DialogHeader>
          <DialogTitle className="text-slate-900">Preview</DialogTitle>
        </DialogHeader>
        <iframe
          title="Page preview"
          src={previewPath}
          className="h-[75vh] w-full rounded-lg border border-slate-200"
        />
      </DialogContent>
    </Dialog>
  );
}
