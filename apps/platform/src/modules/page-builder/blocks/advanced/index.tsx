"use client";

import { useNode } from "@craftjs/core";
import { BlockWrapper } from "@/modules/page-builder/blocks/block-wrapper";
import { StandardSettings, FieldLabel, FieldInput, BUILDER_FIELD_INPUT } from "@/modules/page-builder/components/settings/shared/block-settings";
import { cn } from "@/lib/utils";
import { sanitizeHtml, sanitizeEmbedUrl, sanitizeCustomCss } from "@/modules/page-builder/lib/sanitize";
import type { BlockProps } from "@/modules/page-builder/types/block-props";

type HtmlProps = BlockProps & { html?: string };

function HtmlSettings() {
  const { html, actions: { setProp } } = useNode((node) => ({ html: node.data.props.html as string }));
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <FieldLabel>HTML (sanitized)</FieldLabel>
        <textarea
          className={cn("w-full min-h-[120px] rounded-md border px-2 py-1.5 text-sm font-mono", BUILDER_FIELD_INPUT)}
          value={html ?? ""}
          onChange={(e) => setProp((p: HtmlProps) => { p.html = e.target.value; })}
        />
      </div>
      <StandardSettings />
    </div>
  );
}

export function HtmlBlock({ html = "<p>Custom HTML</p>", ...props }: HtmlProps) {
  const clean = sanitizeHtml(html);
  return (
    <BlockWrapper {...props}>
      <div dangerouslySetInnerHTML={{ __html: clean }} />
    </BlockWrapper>
  );
}

HtmlBlock.craft = {
  displayName: "HTML Block",
  props: { html: "<p><strong>Custom</strong> HTML content</p>" },
  related: { settings: HtmlSettings },
};

type CssProps = BlockProps & { css?: string; scopeId?: string };

function CssSettings() {
  const { css, actions: { setProp } } = useNode((node) => ({ css: node.data.props.css as string }));
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <FieldLabel>Custom CSS (scoped)</FieldLabel>
        <textarea
          className={cn("w-full min-h-[100px] rounded-md border px-2 py-1.5 text-sm font-mono", BUILDER_FIELD_INPUT)}
          value={css ?? ""}
          onChange={(e) => setProp((p: CssProps) => { p.css = e.target.value; })}
        />
      </div>
      <StandardSettings />
    </div>
  );
}

export function CustomCss({ css = "", scopeId = "pb-page", ...props }: CssProps) {
  const scoped = css ? sanitizeCustomCss(css, scopeId) : "";
  return (
    <BlockWrapper {...props} draggable={false}>
      {scoped && <style dangerouslySetInnerHTML={{ __html: scoped }} />}
    </BlockWrapper>
  );
}

CustomCss.craft = {
  displayName: "Custom CSS",
  props: { css: "", scopeId: "pb-page" },
  related: { settings: CssSettings },
};

type EmbedProps = BlockProps & { embedUrl?: string };

function EmbedSettings() {
  const { embedUrl, actions: { setProp } } = useNode((node) => ({ embedUrl: node.data.props.embedUrl as string }));
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <FieldLabel>Embed URL (iframe)</FieldLabel>
        <FieldInput value={embedUrl ?? ""} onChange={(e) => setProp((p: EmbedProps) => { p.embedUrl = e.target.value; })} />
      </div>
      <StandardSettings />
    </div>
  );
}

export function EmbedCode({ embedUrl = "", ...props }: EmbedProps) {
  const safe = embedUrl ? sanitizeEmbedUrl(embedUrl) : null;
  return (
    <BlockWrapper {...props} layout={{ width: "100%", minHeight: "200px", ...props.layout }}>
      {safe ? (
        <iframe src={safe} title="Embed" className="h-full w-full min-h-[200px] rounded-lg border" sandbox="allow-scripts allow-same-origin allow-popups" />
      ) : (
        <div className="flex h-48 items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">
          Add a valid HTTPS embed URL (YouTube, Vimeo)
        </div>
      )}
    </BlockWrapper>
  );
}

EmbedCode.craft = {
  displayName: "Embed Code",
  props: { embedUrl: "" },
  related: { settings: EmbedSettings },
};
