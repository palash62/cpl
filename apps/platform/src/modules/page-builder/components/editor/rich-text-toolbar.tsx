"use client";

import type { ReactNode } from "react";
import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link2,
  Highlighter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { applyRichTextCommand } from "@/modules/page-builder/lib/rich-text-editor-store";
import { GHL_FIELD_LABEL } from "@/modules/page-builder/lib/builder-panel-styles";

function ToolbarButton({
  active,
  onClick,
  title,
  children,
  className,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50",
        active && "border-blue-200 bg-blue-50 text-blue-700",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function RichTextToolbar({
  editor,
  variant = "compact",
}: {
  editor: Editor;
  variant?: "compact" | "panel";
}) {
  function setLink() {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      applyRichTextCommand(editor, (chain) => chain.extendMarkRange("link").unsetLink());
      return;
    }
    applyRichTextCommand(editor, (chain) => chain.extendMarkRange("link").setLink({ href: url }));
  }

  const formatButtons = (
    <>
      <ToolbarButton
        title="Bold"
        active={editor.isActive("bold")}
        onClick={() => applyRichTextCommand(editor, (chain) => chain.toggleBold())}
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Italic"
        active={editor.isActive("italic")}
        onClick={() => applyRichTextCommand(editor, (chain) => chain.toggleItalic())}
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Underline"
        active={editor.isActive("underline")}
        onClick={() => applyRichTextCommand(editor, (chain) => chain.toggleUnderline())}
      >
        <Underline className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Strikethrough"
        active={editor.isActive("strike")}
        onClick={() => applyRichTextCommand(editor, (chain) => chain.toggleStrike())}
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Highlight"
        active={editor.isActive("highlight")}
        onClick={() => applyRichTextCommand(editor, (chain) => chain.toggleHighlight())}
      >
        <Highlighter className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Link"
        active={editor.isActive("link")}
        onClick={setLink}
      >
        <Link2 className="h-4 w-4" />
      </ToolbarButton>
    </>
  );

  const textColorControl = (
    <div className={variant === "panel" ? "space-y-1" : undefined}>
      {variant === "panel" ? <label className={GHL_FIELD_LABEL}>Text color</label> : null}
      <input
        type="color"
        title="Text color"
        className={cn(
          "cursor-pointer rounded-md border border-slate-200 bg-transparent",
          variant === "panel" ? "h-8 w-full p-1" : "h-7 w-7 p-0.5",
        )}
        value={normalizeColor(editor.getAttributes("textStyle").color, "#000000")}
        onChange={(e) =>
          applyRichTextCommand(editor, (chain) => chain.extendMarkRange("textStyle").setColor(e.target.value))
        }
        onMouseDown={(e) => e.preventDefault()}
      />
    </div>
  );

  const highlightControl = (
    <div className={variant === "panel" ? "space-y-1" : undefined}>
      {variant === "panel" ? <label className={GHL_FIELD_LABEL}>Highlight</label> : null}
      <input
        type="color"
        title="Highlight color"
        className={cn(
          "cursor-pointer rounded-md border border-slate-200 bg-transparent",
          variant === "panel" ? "h-8 w-full p-1" : "h-7 w-7 p-0.5",
        )}
        defaultValue="#fef08a"
        onChange={(e) =>
          applyRichTextCommand(editor, (chain) => chain.toggleHighlight({ color: e.target.value }))
        }
        onMouseDown={(e) => e.preventDefault()}
      />
    </div>
  );

  if (variant === "panel") {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-1.5">{formatButtons}</div>
        <div className="grid grid-cols-2 gap-2">
          {textColorControl}
          {highlightControl}
        </div>
      </div>
    );
  }

  return (
    <>
      {formatButtons}
      <div className="mx-0.5 w-px self-stretch bg-slate-200" />
      {textColorControl}
      {highlightControl}
    </>
  );
}

function normalizeColor(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  const t = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(t)) return t;
  if (/^#[0-9a-fA-F]{3}$/.test(t)) {
    const [, r, g, b] = t;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return fallback;
}
