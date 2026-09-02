import { MINUTES_PER_AUTOMATION_DAY } from "./automation-day-window";

export type OrderedStepDelay = {
  delayMinutes: number;
};

/** Minutes to wait after the previous email before this step (0 = none). */
export function getIncrementalWaitMinutes(
  stepDelayMinutes: number,
  previousStepDelayMinutes: number,
): number {
  return Math.max(0, stepDelayMinutes - previousStepDelayMinutes);
}

/** Cumulative delay from automation trigger before this step. */
export function computeCumulativeDelayMinutes(
  previousStepDelayMinutes: number,
  waitDays: number,
): number {
  const waitMinutes = Math.round(waitDays * MINUTES_PER_AUTOMATION_DAY);
  return Math.max(0, previousStepDelayMinutes + waitMinutes);
}

export function computeCumulativeDelayFromWaitMinutes(
  previousStepDelayMinutes: number,
  waitMinutes: number,
): number {
  return Math.max(0, previousStepDelayMinutes + Math.max(0, waitMinutes));
}

/**
 * Repair steps saved with duplicate absolute delays (e.g. 0, 1440, 1440, 1440).
 * When a step's delay is not greater than the previous cumulative value, treat the
 * stored value as a relative wait and stack it.
 */
export function repairCumulativeStepDelays<T extends OrderedStepDelay>(
  steps: T[],
): { steps: T[]; changed: boolean } {
  let prevCumulative = 0;
  let changed = false;

  const repaired = steps.map((step) => {
    let delayMinutes = step.delayMinutes;

    if (delayMinutes > 0 && delayMinutes <= prevCumulative) {
      delayMinutes = prevCumulative + step.delayMinutes;
      changed = true;
    }

    prevCumulative = delayMinutes;
    return { ...step, delayMinutes };
  });

  return { steps: repaired, changed };
}

/** Apply downstream cumulative shift when one step's delay changes. */
export function shiftDownstreamDelays<T extends OrderedStepDelay>(
  steps: T[],
  fromIndex: number,
  deltaMinutes: number,
): T[] {
  if (deltaMinutes === 0 || fromIndex >= steps.length - 1) {
    return steps;
  }

  return steps.map((step, i) => {
    if (i <= fromIndex) return step;
    return {
      ...step,
      delayMinutes: Math.max(0, step.delayMinutes + deltaMinutes),
    };
  });
}
