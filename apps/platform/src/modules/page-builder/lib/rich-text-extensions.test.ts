import { describe, expect, it, vi } from "vitest";
import { EnterHardBreak } from "./rich-text-extensions";

describe("EnterHardBreak", () => {
  it("maps Enter and Shift-Enter to setHardBreak", () => {
    const setHardBreak = vi.fn(() => true);
    const instance = { editor: { commands: { setHardBreak } } };

    const shortcuts = EnterHardBreak.config.addKeyboardShortcuts!.call(instance);

    expect(shortcuts.Enter()).toBe(true);
    expect(shortcuts["Shift-Enter"]()).toBe(true);
    expect(setHardBreak).toHaveBeenCalledTimes(2);
  });
});
