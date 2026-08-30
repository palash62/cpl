/** One automation “day” in the builder UI (delay presets use 1440 minutes). */
export const MINUTES_PER_AUTOMATION_DAY = 1440;

/** Interval between retries while still inside the automation day window. */
export const AUTOMATION_RETRY_INTERVAL_MS = 15 * 60 * 1000;

export const AUTOMATION_DAY_WINDOW_EXPIRED_ERROR = "Automation day window expired";

const PERMANENT_AUTOMATION_ERRORS = [
  "Automation is not active",
  "Automation paused",
  "Contact not subscribed",
  AUTOMATION_DAY_WINDOW_EXPIRED_ERROR,
] as const;

export type AutomationDayWindow = {
  windowStart: Date;
  windowEnd: Date;
};

export function computeAutomationDayWindow(input: {
  scheduledAt: Date;
  stepDelayMinutes: number;
  nextStepDelayMinutes: number | null;
}): AutomationDayWindow {
  const windowStart = input.scheduledAt;
  const dayMs = MINUTES_PER_AUTOMATION_DAY * 60 * 1000;
  const defaultEnd = new Date(windowStart.getTime() + dayMs);

  if (input.nextStepDelayMinutes == null) {
    return { windowStart, windowEnd: defaultEnd };
  }

  const baseTimeMs =
    windowStart.getTime() - input.stepDelayMinutes * 60_000;
  const nextStepStart = new Date(
    baseTimeMs + input.nextStepDelayMinutes * 60_000,
  );

  let windowEnd = defaultEnd;
  if (nextStepStart.getTime() > windowStart.getTime()) {
    windowEnd =
      nextStepStart.getTime() < defaultEnd.getTime() ? nextStepStart : defaultEnd;
  }

  return { windowStart, windowEnd };
}

export function isWithinAutomationDayWindow(
  window: AutomationDayWindow,
  now: Date = new Date(),
): boolean {
  const t = now.getTime();
  return t >= window.windowStart.getTime() && t < window.windowEnd.getTime();
}

/** Next retry time inside the window, or null if the window has ended. */
export function nextAutomationRetryAt(
  window: AutomationDayWindow,
  now: Date = new Date(),
): Date | null {
  if (!isWithinAutomationDayWindow(window, now)) {
    return null;
  }

  const candidate = new Date(now.getTime() + AUTOMATION_RETRY_INTERVAL_MS);
  if (candidate.getTime() < window.windowEnd.getTime()) {
    return candidate;
  }

  // Last attempt: still inside window but less than one interval remains.
  if (now.getTime() < window.windowEnd.getTime()) {
    return new Date(window.windowEnd.getTime() - 60_000);
  }

  return null;
}

export function isRecoverableAutomationError(error: string | null | undefined): boolean {
  if (!error?.trim()) return true;
  return !PERMANENT_AUTOMATION_ERRORS.some(
    (permanent) => error === permanent || error.includes(permanent),
  );
}
