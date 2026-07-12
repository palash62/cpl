"use client";

import { CUSTOM_CODE_SANDBOX } from "@/modules/page-builder/lib/custom-code-srcdoc";
import { cn } from "@/lib/utils";

type CustomCodePreviewFrameProps = {
  srcDoc: string;
  title?: string;
  className?: string;
  minHeight?: string;
  /** When true, iframe ignores pointer events (builder canvas). */
  pointerEventsNone?: boolean;
  /** Remount key to force preview refresh. */
  previewKey?: string | number;
};

export function CustomCodePreviewFrame({
  srcDoc,
  title = "Custom code preview",
  className,
  minHeight = "100%",
  pointerEventsNone = false,
  previewKey,
}: CustomCodePreviewFrameProps) {
  return (
    <iframe
      key={previewKey}
      title={title}
      srcDoc={srcDoc}
      sandbox={CUSTOM_CODE_SANDBOX}
      className={cn(
        "h-full w-full border-0 bg-white",
        pointerEventsNone && "pointer-events-none",
        className,
      )}
      style={{ minHeight }}
    />
  );
}
