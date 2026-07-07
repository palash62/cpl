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

export function PageSettingsDrawer() {
  const open = useBuilderStore((s) => s.pageSettingsOpen);
  const setOpen = useBuilderStore((s) => s.setPageSettingsOpen);
  const pageName = useBuilderStore((s) => s.pageName);
  const pageSlug = useBuilderStore((s) => s.pageSlug);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Page settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Page name</Label>
            <Input value={pageName} readOnly />
          </div>
          <div className="space-y-1.5">
            <Label>Slug / URL path</Label>
            <Input value={pageSlug} readOnly />
          </div>
          <div className="space-y-1.5">
            <Label>SEO title</Label>
            <Input placeholder="Page title for search engines" />
          </div>
          <div className="space-y-1.5">
            <Label>Meta description</Label>
            <textarea className="min-h-[80px] w-full rounded-md border px-3 py-2 text-sm" placeholder="Short description for search results" />
          </div>
          <div className="space-y-1.5">
            <Label>Custom head scripts</Label>
            <textarea className="min-h-[80px] w-full rounded-md border px-3 py-2 font-mono text-xs" placeholder="<!-- tracking pixels, etc. -->" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
