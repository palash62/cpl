"use client";

import { useEffect, useRef, useState } from "react";
import {
  CUSTOM_CODE_RESIZE_MESSAGE,
  CUSTOM_CODE_SANDBOX,
} from "@/modules/page-builder/lib/custom-code-srcdoc";
import { cn } from "@/lib/utils";

const AUTO_HEIGHT_FALLBACK_PX = 120;

type CustomCodePreviewFrameProps = {
  srcDoc: string;
  title?: string;
  className?: string;
  minHeight?: string;
  /** When true, iframe ignores pointer events (builder canvas). */
  pointerEventsNone?: boolean;
  /** Remount key to force preview refresh. */
  previewKey?: string | number;
  /** Size iframe height from content via postMessage reporter. */
  autoHeight?: boolean;
};

function parseCssLengthPx(value: string | undefined): number | undefined {
  if (!value?.trim()) return undefined;
  const match = value.trim().match(/^(\d+(?:\.\d+)?)px$/i);
  if (!match) return undefined;
  const n = Number(match[1]);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export function CustomCodePreviewFrame({
  srcDoc,
  title = "Custom code preview",
  className,
  minHeight,
  pointerEventsNone = false,
  previewKey,
  autoHeight = false,
}: CustomCodePreviewFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);

  useEffect(() => {
    setMeasuredHeight(null);
  }, [srcDoc, previewKey]);

  useEffect(() => {
    if (!autoHeight) return;

    const onMessage = (event: MessageEvent) => {
      const iframe = iframeRef.current;
      if (!iframe || event.source !== iframe.contentWindow) return;
      const data = event.data;
      if (
        !data ||
        typeof data !== "object" ||
        data.type !== CUSTOM_CODE_RESIZE_MESSAGE ||
        typeof data.height !== "number" ||
        !Number.isFinite(data.height) ||
        data.height <= 0
      ) {
        return;
      }
      setMeasuredHeight(Math.ceil(data.height));
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [autoHeight]);

  const minHeightPx = parseCssLengthPx(minHeight);
  const heightPx = autoHeight
    ? Math.max(
        measuredHeight ?? AUTO_HEIGHT_FALLBACK_PX,
        minHeightPx ?? 0,
      )
    : undefined;

  return (
    <iframe
      ref={iframeRef}
      key={previewKey}
      title={title}
      srcDoc={srcDoc}
      sandbox={CUSTOM_CODE_SANDBOX}
      className={cn(
        "w-full border-0",
        !autoHeight && "h-full",
        pointerEventsNone && "pointer-events-none",
        className,
      )}
      style={{
        ...(minHeight && !autoHeight ? { minHeight } : {}),
        ...(autoHeight
          ? {
              height: `${heightPx}px`,
              minHeight: minHeight || undefined,
            }
          : {}),
      }}
    />
  );
}
