import type { Editor } from "@tiptap/react";
import { create } from "zustand";

export type SavedSelection = { from: number; to: number };

type RichTextEditorState = {
  activeEditor: Editor | null;
  savedSelection: SavedSelection | null;
  /** Incremented on selection/format changes so the panel re-renders. */
  revision: number;
  setActiveEditor: (editor: Editor | null) => void;
  saveSelection: (from: number, to: number) => void;
  bumpRevision: () => void;
  clearActiveEditor: (editor: Editor) => void;
};

export const useRichTextEditorStore = create<RichTextEditorState>((set, get) => ({
  activeEditor: null,
  savedSelection: null,
  revision: 0,
  setActiveEditor: (editor) => set({ activeEditor: editor }),
  saveSelection: (from, to) => {
    // Keep the last highlighted range; don't overwrite with a collapsed caret on blur.
    if (from !== to) {
      set({ savedSelection: { from, to } });
    }
  },
  bumpRevision: () => set({ revision: get().revision + 1 }),
  clearActiveEditor: (editor) => {
    if (get().activeEditor === editor) {
      set({ activeEditor: null, savedSelection: null });
    }
  },
}));

/** Apply a TipTap command while restoring the last canvas text selection. */
export function applyRichTextCommand(
  editor: Editor,
  apply: (chain: ReturnType<Editor["chain"]>) => ReturnType<Editor["chain"]>,
) {
  const saved = useRichTextEditorStore.getState().savedSelection;
  let chain = editor.chain().focus();
  if (saved) {
    chain = chain.setTextSelection({ from: saved.from, to: saved.to });
  }
  apply(chain).run();
  useRichTextEditorStore.getState().bumpRevision();
}
