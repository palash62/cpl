import Document from "@tiptap/extension-document";
import HardBreak from "@tiptap/extension-hard-break";

/** Inline-only doc: text fields must not emit block nodes (p/div) for valid HTML nesting. */
export const InlineDocument = Document.extend({
  content: "inline*",
});

/** Map Enter and Shift+Enter to hard breaks; default Enter would try to create a paragraph. */
export const EnterHardBreak = HardBreak.extend({
  addKeyboardShortcuts() {
    return {
      Enter: () => this.editor.commands.setHardBreak(),
      "Shift-Enter": () => this.editor.commands.setHardBreak(),
    };
  },
});
