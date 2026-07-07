"use client";

import { PageRenderer } from "@/modules/page-builder/components/renderer/page-renderer";
import { extractFormJson } from "@/modules/page-builder/lib/extract-form-json";
import type { CraftSerializedState } from "@/modules/page-builder/types/page-document";
import type { ThemeJson } from "@/modules/page-builder/lib/theme";

type FunnelTemplatePreviewProps = {
  templateName: string;
  craftState: CraftSerializedState;
  theme: ThemeJson;
};

export function FunnelTemplatePreview({ templateName, craftState, theme }: FunnelTemplatePreviewProps) {
  const formJson = extractFormJson(craftState, "");

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">
        Preview: <span className="font-semibold">{templateName}</span> — leads are not captured in template preview.
      </div>
      <PageRenderer
        craftState={craftState}
        theme={theme}
        formJson={formJson}
        onLeadSubmit={async () => {
          /* preview only */
        }}
      />
    </div>
  );
}
