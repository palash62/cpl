"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import Document from "@tiptap/extension-document";
import Text from "@tiptap/extension-text";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import Strike from "@tiptap/extension-strike";
import Underline from "@tiptap/extension-underline";
import HardBreak from "@tiptap/extension-hard-break";
import Highlight from "@tiptap/extension-highlight";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { FontSize } from "@tiptap/extension-text-style/font-size";
import Link from "@tiptap/extension-link";
import { useRichTextEditorStore } from "@/modules/page-builder/lib/rich-text-editor-store";
import { sanitizeInlineHtml } from "@/modules/page-builder/lib/sanitize";
import { cn } from "@/lib/utils";

const InlineDocument = Document.extend({
  content: "inline*",
});

type RichTextFieldProps = {
  value: string;
  onChange: (html: string) => void;
  editable?: boolean;
  className?: string;
};

export function RichTextField({ value, onChange, editable = false, className }: RichTextFieldProps) {
  const setActiveEditor = useRichTextEditorStore((s) => s.setActiveEditor);
  const clearActiveEditor = useRichTextEditorStore((s) => s.clearActiveEditor);
  const saveSelection = useRichTextEditorStore((s) => s.saveSelection);
  const bumpRevision = useRichTextEditorStore((s) => s.bumpRevision);

  const editor = useEditor({
    extensions: [
      InlineDocument,
      Text,
      Bold,
      Italic,
      Strike,
      Underline,
      HardBreak,
      TextStyle,
      FontSize,
      Color,
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false, autolink: true }),
    ],
    content: value || "",
    editable,
    editorProps: {
      attributes: {
        class: cn("pb-rich-text-editor outline-none", className),
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
    onFocus: ({ editor: ed }) => {
      setActiveEditor(ed);
      const { from, to } = ed.state.selection;
      saveSelection(from, to);
    },
    onBlur: ({ editor: ed }) => {
      const { from, to } = ed.state.selection;
      saveSelection(from, to);
    },
    onSelectionUpdate: ({ editor: ed }) => {
      const { from, to } = ed.state.selection;
      saveSelection(from, to);
      bumpRevision();
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(editable);
  }, [editor, editable]);

  useEffect(() => {
    if (!editor) return;
    const next = value || "";
    const current = editor.getHTML();
    if (next !== current) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [value, editor]);

  useEffect(() => {
    return () => {
      if (editor) clearActiveEditor(editor);
    };
  }, [editor, clearActiveEditor]);

  if (!editable) {
    return (
      <span
        className={cn("pb-rich-text", className)}
        dangerouslySetInnerHTML={{ __html: sanitizeInlineHtml(value || "") }}
      />
    );
  }

  if (!editor) return null;

  return (
    <div
      className={cn("pb-rich-text-editor-wrap", className)}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <EditorContent editor={editor} />
    </div>
  );
}
