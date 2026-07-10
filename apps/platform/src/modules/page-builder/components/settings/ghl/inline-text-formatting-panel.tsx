"use client";

import { useRichTextEditorStore } from "@/modules/page-builder/lib/rich-text-editor-store";
import { RichTextToolbar } from "@/modules/page-builder/components/editor/rich-text-toolbar";
import { GHL_FIELD_LABEL, GHL_SECTION_CARD, GHL_SECTION_TITLE } from "@/modules/page-builder/lib/builder-panel-styles";

export function InlineTextFormattingPanel() {
  const activeEditor = useRichTextEditorStore((s) => s.activeEditor);
  // Subscribe to revision so active states refresh after formatting.
  useRichTextEditorStore((s) => s.revision);

  if (!activeEditor) {
    return (
      <div className={GHL_SECTION_CARD}>
        <p className={GHL_SECTION_TITLE}>Selected text</p>
        <p className="text-[11px] leading-snug text-slate-500">
          Click into text on the canvas and highlight words to format them here.
        </p>
      </div>
    );
  }

  return (
    <div className={GHL_SECTION_CARD}>
      <p className={GHL_SECTION_TITLE}>Selected text</p>
      <p className="mb-2 text-[11px] leading-snug text-slate-500">
        Applies to highlighted text in the editor.
      </p>
      <RichTextToolbar editor={activeEditor} variant="panel" />
    </div>
  );
}

export const RICH_TEXT_BLOCK_NAMES = new Set([
  "Heading",
  "Paragraph",
  "List",
  "CTA Button",
  "Submit Button",
]);
