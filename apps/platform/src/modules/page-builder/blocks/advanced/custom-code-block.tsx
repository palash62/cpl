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
  BUILDER_FIELD_INPUT,
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
          value={iframeMinHeight ?? "240px"}
          onChange={(e) =>
            setProp((p: CustomCodeProps) => {
              p.iframeMinHeight = e.target.value;
            })
          }
          placeholder="240px"
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
  iframeMinHeight = "240px",
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
  const hasContent = hasCustomCodeContent(html ?? "", css ?? "", js ?? "");
  const showEditOverlay = enabled && (selected || hovered);

  return (
    <BlockWrapper
      {...props}
      draggable={false}
      layout={{ width: "100%", minHeight: iframeMinHeight, ...props.layout }}
    >
      <div
        className="relative w-full overflow-hidden rounded-lg border border-slate-200 bg-white"
        style={{ minHeight: iframeMinHeight }}
      >
        {hasContent ? (
          <CustomCodePreviewFrame
            srcDoc={srcDoc}
            pointerEventsNone={enabled}
            minHeight={iframeMinHeight}
            title="Custom code block"
          />
        ) : (
          <div
            className="flex items-center justify-center bg-muted/40 text-sm text-muted-foreground"
            style={{ minHeight: iframeMinHeight }}
          >
            Add custom HTML, CSS, and JavaScript
          </div>
        )}

        {showEditOverlay ? (
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center bg-slate-900/5 transition-opacity",
              selected ? "opacity-100" : "opacity-0 hover:opacity-100",
            )}
          >
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="gap-1.5 shadow-sm"
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
    iframeMinHeight: "240px",
    autoOpenEditor: true,
  },
  related: { settings: CustomCodeSettings },
};
