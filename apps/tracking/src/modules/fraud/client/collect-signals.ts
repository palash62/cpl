"use client";

import type { SubmissionMeta } from "../types/result";

export type SignalCollectorState = {
  startedAt: number;
  mouseMoveCount: number;
  keyPressCount: number;
  pasteCount: number;
};

export function createSignalCollector(): SignalCollectorState {
  return {
    startedAt: Date.now(),
    mouseMoveCount: 0,
    keyPressCount: 0,
    pasteCount: 0,
  };
}

export function attachSignalListeners(state: SignalCollectorState) {
  if (typeof window === "undefined") return () => {};

  const onMouseMove = () => {
    state.mouseMoveCount += 1;
  };
  const onKeyDown = () => {
    state.keyPressCount += 1;
  };
  const onPaste = () => {
    state.pasteCount += 1;
  };

  window.addEventListener("mousemove", onMouseMove, { passive: true });
  window.addEventListener("keydown", onKeyDown, { passive: true });
  window.addEventListener("paste", onPaste, { passive: true });

  return () => {
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("paste", onPaste);
  };
}

export function collectSubmissionSignals(state: SignalCollectorState): {
  submissionMeta: SubmissionMeta;
  deviceFingerprint: string;
} {
  const submissionMeta: SubmissionMeta = {
    formDurationMs: Date.now() - state.startedAt,
    mouseMoveCount: state.mouseMoveCount,
    keyPressCount: state.keyPressCount,
    pasteCount: state.pasteCount,
    timezone: typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined,
    language: typeof navigator !== "undefined" ? navigator.language : undefined,
    screenWxH:
      typeof window !== "undefined" ? `${window.screen.width}x${window.screen.height}` : undefined,
    platform: typeof navigator !== "undefined" ? navigator.platform : undefined,
  };

  const raw = [
    submissionMeta.timezone,
    submissionMeta.language,
    submissionMeta.screenWxH,
    submissionMeta.platform,
    typeof navigator !== "undefined" ? navigator.userAgent : "",
  ].join("|");

  let hash = 0;
  for (let i = 0; i < raw.length; i += 1) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }

  return {
    submissionMeta,
    deviceFingerprint: `fp_${Math.abs(hash).toString(36)}`,
  };
}
