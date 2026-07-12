"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { Editor, Frame } from "@craftjs/core";
import { craftResolver } from "@/modules/page-builder/blocks";
import {
  pageBackgroundLayerStyle,
  pageCanvasShellStyle,
  pageShellStyle,
} from "@/modules/page-builder/lib/theme";
import { previewContentRevision } from "@/modules/page-builder/lib/preview-revision";
import { PublishedPageProvider } from "@/modules/page-builder/lib/published-page-context";
import {
  getCanvasFrameWidthStyle,
  getCanvasViewportFill,
} from "@/modules/page-builder/lib/editor-canvas";
import type { CraftSerializedState } from "@/modules/page-builder/types/page-document";
import type { ThemeJson } from "@/modules/page-builder/lib/theme";
import { DEFAULT_THEME } from "@/modules/page-builder/lib/theme";
import type { FormJson } from "@/modules/page-builder/types/form-field";
import type { Breakpoint } from "@/modules/page-builder/types/block-props";
import { cn } from "@/lib/utils";
import "@/modules/page-builder/styles/page-builder-rich-text.css";
import "@/modules/page-builder/styles/page-builder-animations.css";
import "@/modules/page-builder/styles/page-builder-layout.css";

type PageRendererProps = {
  craftState: CraftSerializedState;
  theme?: ThemeJson;
  landingPageSlug?: string;
  formJson?: FormJson | null;
  onLeadSubmit?: (data: Record<string, string>) => Promise<void>;
  /** When true, fill a parent flex column (e.g. preview banner + page). */
  fillParent?: boolean;
  /** Override responsive breakpoint (preview from editor device switcher). */
  breakpoint?: Breakpoint;
  /** Frame preview at the same width/height as the GHL editor canvas. */
  matchEditorCanvas?: boolean;
  isGhl?: boolean;
  /** Compact layout for card thumbnails (no outer padding). */
  compactPreview?: boolean;
};

function craftHasLeadForm(craft: CraftSerializedState): boolean {
  return Object.values(craft).some((node) => node?.type?.resolvedName === "LeadForm");
}

export function PageRenderer({
  craftState,
  theme = DEFAULT_THEME,
  landingPageSlug,
  formJson,
  onLeadSubmit,
  fillParent = false,
  breakpoint: breakpointProp,
  matchEditorCanvas = false,
  isGhl = true,
  compactPreview = false,
}: PageRendererProps) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const needsImplicitForm = !!onLeadSubmit && !craftHasLeadForm(craftState);
  const revision = previewContentRevision(craftState, theme);
  const breakpoint = breakpointProp ?? "desktop";

  const editorViewportFill = matchEditorCanvas
    ? getCanvasViewportFill(breakpoint, isGhl)
    : undefined;
  const viewportFill = matchEditorCanvas
    ? editorViewportFill!
    : fillParent
      ? "calc(100dvh - 2.5rem)"
      : "100dvh";
  const canvasFrameStyle = matchEditorCanvas
    ? getCanvasFrameWidthStyle(breakpoint, isGhl)
    : undefined;

  async function handleImplicitSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!onLeadSubmit || loading) return;

    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const data: Record<string, string> = {};
    formData.forEach((value, key) => {
      if (key !== "honeypot") data[key] = String(value);
    });

    try {
      await onLeadSubmit(data);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setLoading(false);
    }
  }

  const pageInner = (
    <>
      {error && (
        <div className="mx-auto max-w-3xl px-4 pt-4">
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        </div>
      )}
      {submitted && !error ? (
        <div className="flex min-h-[40vh] items-center justify-center px-4 text-sm text-slate-600">
          Submitting…
        </div>
      ) : (
        <Editor resolver={craftResolver} enabled={false}>
          <Frame key={revision} data={craftState as never} />
        </Editor>
      )}
      {needsImplicitForm && loading && (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center">
          <span className="rounded-full bg-slate-900/90 px-3 py-1.5 text-xs text-white">
            Submitting…
          </span>
        </div>
      )}
    </>
  );

  const page = matchEditorCanvas ? (
    <div
      className={cn(
        "flex w-full justify-center overflow-auto",
        compactPreview ? "p-0" : "p-6",
        fillParent ? "min-h-0 flex-1 items-start" : "min-h-screen",
      )}
      style={{
        ...pageBackgroundLayerStyle(theme),
        ...pageCanvasShellStyle(theme, { viewportFill: editorViewportFill }),
      }}
    >
      <div
        id="pb-page"
        className={cn(
          "pb-published-page flex shrink-0 flex-col",
          fillParent && "min-h-0",
        )}
        style={{
          ...canvasFrameStyle,
          minHeight: editorViewportFill,
        }}
      >
        {pageInner}
      </div>
    </div>
  ) : (
    <div
      id="pb-page"
      className={
        fillParent
          ? "pb-published-page flex min-h-0 w-full flex-1 flex-col"
          : "pb-published-page flex w-full flex-col"
      }
      style={pageShellStyle(theme, { viewportFill })}
    >
      {pageInner}
    </div>
  );

  const providerValue = {
    landingPageSlug,
    onLeadSubmit,
    formJson,
    theme,
    breakpoint: breakpointProp,
    matchEditorCanvas,
    isGhl,
  };

  return (
    <PublishedPageProvider value={providerValue}>
      {needsImplicitForm ? (
        <form
          id="pb-optin-form"
          className={fillParent ? "flex min-h-0 flex-1 flex-col" : undefined}
          onSubmit={handleImplicitSubmit}
          noValidate
        >
          <input type="text" name="honeypot" className="hidden" tabIndex={-1} autoComplete="off" />
          {page}
        </form>
      ) : (
        page
      )}
    </PublishedPageProvider>
  );
}
