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

  return (
    <Dialog open={open} onOpenChange={setPreviewOpen}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Preview</DialogTitle>
        </DialogHeader>
        <iframe
          title="Page preview"
          src={`/advertiser/landing-pages/preview?slug=${encodeURIComponent(pageSlug)}`}
          className="h-[70vh] w-full rounded-lg border"
        />
      </DialogContent>
    </Dialog>
  );
}
