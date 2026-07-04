"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useBuilderStore } from "@/modules/page-builder/lib/builder-store";
import { toast } from "sonner";

type Version = {
  id: string;
  versionNumber: number;
  label: string | null;
  createdAt: string;
};

type VersionHistoryDrawerProps = { pageId: string };

export function VersionHistoryDrawer({ pageId }: VersionHistoryDrawerProps) {
  const open = useBuilderStore((s) => s.versionHistoryOpen);
  const setOpen = useBuilderStore((s) => s.setVersionHistoryOpen);
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const apiBasePath = useBuilderStore.getState().builderConfig.apiBasePath;
    setLoading(true);
    fetch(`${apiBasePath}/${pageId}/versions`)
      .then((r) => r.json())
      .then((body) => setVersions(body.data ?? []))
      .finally(() => setLoading(false));
  }, [open, pageId]);

  async function restore(versionId: string) {
    const apiBasePath = useBuilderStore.getState().builderConfig.apiBasePath;
    const res = await fetch(`${apiBasePath}/${pageId}/versions/${versionId}/restore`, {
      method: "POST",
    });
    if (!res.ok) {
      toast.error("Failed to restore version");
      return;
    }
    toast.success("Version restored — reloading...");
    window.location.reload();
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Version History</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-2">
          {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
          {!loading && versions.length === 0 && (
            <p className="text-sm text-muted-foreground">No versions yet. Publish or save to create versions.</p>
          )}
          {versions.map((v) => (
            <div key={v.id} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">v{v.versionNumber}</p>
                <p className="text-xs text-muted-foreground">
                  {v.label ?? "Snapshot"} · {new Date(v.createdAt).toLocaleString()}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => restore(v.id)}>
                Restore
              </Button>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
