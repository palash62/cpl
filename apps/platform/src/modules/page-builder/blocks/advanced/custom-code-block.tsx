"use client";

import { useEffect, useMemo } from "react";
import { useEditor, useNode } from "@craftjs/core";
import { Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BlockWrapper } from "@/modules/page-builder/blocks/block-wrapper";
import {
  StandardSettings,
  FieldLabel,
  FieldInput,
} from "@/modules/page-builder/components/settings/shared/block-settings";
import { CustomCodePreviewFrame } from "@/modules/page-builder/components/custom-code/custom-code-preview-frame";
import {
  buildCustomCodeSrcdoc,
  CUSTOM_CODE_DEFAULT_HTML,
  hasCustomCodeContent,
} from "@/modules/page-builder/lib/custom-code-srcdoc";
import { useBuilderStore } from "@/modules/page-builder/lib/builder-store";
import type { BlockProps } from "@/modules/page-builder/types/block-props";
import { cn } from "@/lib/utils";

export type CustomCodeProps = BlockProps & {
  html?: string;
  css?: string;
  js?: string;
  iframeMinHeight?: string;
  /** Opens editor once after block is inserted. */
  autoOpenEditor?: boolean;
};

function CustomCodeSettings() {
  const {
    html,
    css,
    js,
    iframeMinHeight,
    id,
    actions: { setProp },
  } = useNode((node) => ({
    html: node.data.props.html as string,
    css: node.data.props.css as string,
    js: node.data.props.js as string,
    iframeMinHeight: node.data.props.iframeMinHeight as string,
    id: node.id,
  }));
  const openCustomCodeEditor = useBuilderStore((s) => s.openCustomCodeEditor);

  const summary = hasCustomCodeContent(html ?? "", css ?? "", js ?? "")
    ? `${(html ?? "").length} HTML · ${(css ?? "").length} CSS · ${(js ?? "").length} JS chars`
    : "No code saved yet";

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <FieldLabel>Custom Code</FieldLabel>
        <p className="text-xs text-muted-foreground">{summary}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full gap-1.5"
          onClick={() => openCustomCodeEditor(id)}
        >
          <Code2 className="size-3.5" />
          Edit Code
        </Button>
      </div>
      <div className="space-y-1.5">
        <FieldLabel>Min height</FieldLabel>
        <FieldInput
          value={iframeMinHeight ?? ""}
          onChange={(e) =>
            setProp((p: CustomCodeProps) => {
              p.iframeMinHeight = e.target.value;
            })
          }
          placeholder="optional (e.g. 240px)"
        />
      </div>
      <StandardSettings />
    </div>
  );
}

export function CustomCode({
  html = CUSTOM_CODE_DEFAULT_HTML,
  css = "",
  js = "",
  iframeMinHeight = "",
  autoOpenEditor = false,
  ...props
}: CustomCodeProps) {
  const {
    id,
    selected,
    hovered,
    actions: { setProp },
  } = useNode((node) => ({
    id: node.id,
    selected: node.events.selected,
    hovered: node.events.hovered,
  }));
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const openCustomCodeEditor = useBuilderStore((s) => s.openCustomCodeEditor);

  useEffect(() => {
    if (!enabled || !autoOpenEditor) return;
    openCustomCodeEditor(id);
    setProp((p: CustomCodeProps) => {
      p.autoOpenEditor = false;
    });
  }, [enabled, autoOpenEditor, id, openCustomCodeEditor, setProp]);

  const srcDoc = useMemo(
    () => buildCustomCodeSrcdoc(html ?? "", css ?? "", js ?? ""),
    [html, css, js],
  );
  const previewKey = useMemo(
    () => `${(html ?? "").length}:${(css ?? "").length}:${(js ?? "").length}:${(html ?? "").slice(0, 32)}:${(css ?? "").slice(0, 32)}`,
    [html, css, js],
  );
  const hasContent = hasCustomCodeContent(html ?? "", css ?? "", js ?? "");
  const showEditOverlay = enabled && (selected || hovered);
  const minHeight = iframeMinHeight.trim() || undefined;

  return (
    <BlockWrapper
      {...props}
      draggable={false}
      layout={{
        width: "100%",
        ...(minHeight ? { minHeight } : {}),
        ...props.layout,
      }}
    >
      <div
        className="relative w-full"
        style={minHeight ? { minHeight } : undefined}
      >
        {hasContent ? (
          <CustomCodePreviewFrame
            srcDoc={srcDoc}
            previewKey={previewKey}
            autoHeight
            pointerEventsNone={enabled}
            minHeight={minHeight}
            title="Custom code block"
          />
        ) : (
          <div className="flex items-center justify-center py-3 text-sm text-muted-foreground">
            Add custom HTML, CSS, and JavaScript
          </div>
        )}

        {showEditOverlay ? (
          <div
            className={cn(
              "pointer-events-none absolute inset-0 transition-opacity",
              selected ? "opacity-100" : "opacity-0 hover:opacity-100",
            )}
          >
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="pointer-events-auto absolute right-2 bottom-2 gap-1.5 shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                openCustomCodeEditor(id);
              }}
            >
              <Code2 className="size-3.5" />
              Edit Code
            </Button>
          </div>
        ) : null}
      </div>
    </BlockWrapper>
  );
}

CustomCode.craft = {
  displayName: "Custom Code",
  props: {
    html: CUSTOM_CODE_DEFAULT_HTML,
    css: "",
    js: "",
    iframeMinHeight: "",
    autoOpenEditor: true,
    layout: { width: "100%" },
  },
  related: { settings: CustomCodeSettings },
};
