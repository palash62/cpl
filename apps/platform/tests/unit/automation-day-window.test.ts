import { describe, expect, it } from "vitest";
import {
  AUTOMATION_DAY_WINDOW_EXPIRED_ERROR,
  AUTOMATION_RETRY_INTERVAL_MS,
  computeAutomationDayWindow,
  isRecoverableAutomationError,
  isWithinAutomationDayWindow,
  MINUTES_PER_AUTOMATION_DAY,
  nextAutomationRetryAt,
} from "@/modules/email-marketing/lib/automation-day-window";

describe("computeAutomationDayWindow", () => {
  const base = new Date("2026-08-30T10:00:00.000Z");

  it("uses 24h window when there is no next step", () => {
    const scheduledAt = base;
    const window = computeAutomationDayWindow({
      scheduledAt,
      stepDelayMinutes: 0,
      nextStepDelayMinutes: null,
    });
    expect(window.windowStart).toEqual(scheduledAt);
    expect(window.windowEnd.getTime()).toBe(
      scheduledAt.getTime() + MINUTES_PER_AUTOMATION_DAY * 60_000,
    );
  });

  it("ends at next step start when sooner than 24h", () => {
    const scheduledAt = base;
    const window = computeAutomationDayWindow({
      scheduledAt,
      stepDelayMinutes: 0,
      nextStepDelayMinutes: MINUTES_PER_AUTOMATION_DAY,
    });
    expect(window.windowEnd.toISOString()).toBe("2026-08-31T10:00:00.000Z");
  });

  it("Day 1 step window ends when Day 2 step begins", () => {
    const scheduledAt = new Date("2026-08-31T10:00:00.000Z");
    const window = computeAutomationDayWindow({
      scheduledAt,
      stepDelayMinutes: MINUTES_PER_AUTOMATION_DAY,
      nextStepDelayMinutes: MINUTES_PER_AUTOMATION_DAY * 2,
    });
    expect(window.windowEnd.toISOString()).toBe("2026-09-01T10:00:00.000Z");
  });
});

describe("isWithinAutomationDayWindow", () => {
  it("is true inside the window", () => {
    const start = new Date("2026-08-30T10:00:00.000Z");
    const window = {
      windowStart: start,
      windowEnd: new Date("2026-08-31T10:00:00.000Z"),
    };
    expect(isWithinAutomationDayWindow(window, new Date("2026-08-30T15:00:00.000Z"))).toBe(
      true,
    );
  });

  it("is false after the window ends", () => {
    const window = computeAutomationDayWindow({
      scheduledAt: new Date("2026-08-30T10:00:00.000Z"),
      stepDelayMinutes: 0,
      nextStepDelayMinutes: null,
    });
    expect(isWithinAutomationDayWindow(window, new Date("2026-08-31T10:00:00.000Z"))).toBe(
      false,
    );
  });
});

describe("nextAutomationRetryAt", () => {
  it("schedules 15 minutes ahead within the window", () => {
    const window = computeAutomationDayWindow({
      scheduledAt: new Date("2026-08-30T10:00:00.000Z"),
      stepDelayMinutes: 0,
      nextStepDelayMinutes: null,
    });
    const now = new Date("2026-08-30T10:05:00.000Z");
    const retry = nextAutomationRetryAt(window, now);
    expect(retry?.getTime()).toBe(now.getTime() + AUTOMATION_RETRY_INTERVAL_MS);
  });

  it("returns null when the window has passed", () => {
    const window = computeAutomationDayWindow({
      scheduledAt: new Date("2026-08-30T10:00:00.000Z"),
      stepDelayMinutes: 0,
      nextStepDelayMinutes: null,
    });
    expect(
      nextAutomationRetryAt(window, new Date("2026-08-31T11:00:00.000Z")),
    ).toBeNull();
  });
});

describe("isRecoverableAutomationError", () => {
  it("treats wallet and cap errors as recoverable", () => {
    expect(
      isRecoverableAutomationError(
        "Insufficient Autoresponder wallet balance — top up to continue sending",
      ),
    ).toBe(true);
    expect(isRecoverableAutomationError("Daily send limit reached (5000)")).toBe(true);
  });

  it("treats permanent blocks as non-recoverable", () => {
    expect(isRecoverableAutomationError("Contact not subscribed")).toBe(false);
    expect(isRecoverableAutomationError("Automation paused")).toBe(false);
    expect(isRecoverableAutomationError(AUTOMATION_DAY_WINDOW_EXPIRED_ERROR)).toBe(
      false,
    );
  });
});
