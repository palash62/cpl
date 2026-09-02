import { describe, expect, it } from "vitest";
import {
  computeCumulativeDelayMinutes,
  getIncrementalWaitMinutes,
  repairCumulativeStepDelays,
  shiftDownstreamDelays,
} from "@/modules/email-marketing/lib/automation-step-delays";
import {
  computeCumulativeDelayForStep,
  getIncrementalWaitDays,
} from "@/components/advertiser/email/automation-builder/types";

describe("repairCumulativeStepDelays", () => {
  it("repairs Welcome Sequence pattern 0,1440,1440,1440", () => {
    const input = [
      { delayMinutes: 0 },
      { delayMinutes: 1440 },
      { delayMinutes: 1440 },
      { delayMinutes: 1440 },
    ];
    const { steps, changed } = repairCumulativeStepDelays(input);
    expect(changed).toBe(true);
    expect(steps.map((s) => s.delayMinutes)).toEqual([0, 1440, 2880, 4320]);
  });

  it("leaves already-cumulative delays unchanged", () => {
    const input = [
      { delayMinutes: 0 },
      { delayMinutes: 1440 },
      { delayMinutes: 2880 },
      { delayMinutes: 4320 },
    ];
    const { steps, changed } = repairCumulativeStepDelays(input);
    expect(changed).toBe(false);
    expect(steps.map((s) => s.delayMinutes)).toEqual([0, 1440, 2880, 4320]);
  });
});

describe("computeCumulativeDelayMinutes", () => {
  it("stacks wait days on previous cumulative delay", () => {
    expect(computeCumulativeDelayMinutes(0, 1)).toBe(1440);
    expect(computeCumulativeDelayMinutes(1440, 1)).toBe(2880);
    expect(computeCumulativeDelayMinutes(2880, 1)).toBe(4320);
  });
});

describe("builder cumulative helpers", () => {
  const steps = [
    { delayMinutes: 0 },
    { delayMinutes: 1440 },
    { delayMinutes: 2880 },
    { delayMinutes: 4320 },
  ];

  it("computes incremental wait days for display", () => {
    expect(getIncrementalWaitDays(steps, 0)).toBe(0);
    expect(getIncrementalWaitDays(steps, 1)).toBe(1);
    expect(getIncrementalWaitDays(steps, 2)).toBe(1);
  });

  it("computes cumulative delay when adding 1-day wait", () => {
    expect(computeCumulativeDelayForStep(steps, 1, 1)).toBe(1440);
    expect(computeCumulativeDelayForStep(steps, 2, 1)).toBe(2880);
    expect(computeCumulativeDelayForStep(steps, 3, 1)).toBe(4320);
  });
});

describe("shiftDownstreamDelays", () => {
  it("shifts later steps when middle wait increases", () => {
    const steps = [
      { id: "a", delayMinutes: 0 },
      { id: "b", delayMinutes: 1440 },
      { id: "c", delayMinutes: 2880 },
    ];
    const shifted = shiftDownstreamDelays(
      steps.map((s) => ({ delayMinutes: s.delayMinutes })),
      1,
      1440,
    );
    expect(shifted.map((s) => s.delayMinutes)).toEqual([0, 1440, 4320]);
  });
});

describe("getIncrementalWaitMinutes", () => {
  it("returns difference from previous step", () => {
    expect(getIncrementalWaitMinutes(2880, 1440)).toBe(1440);
    expect(getIncrementalWaitMinutes(1440, 1440)).toBe(0);
  });
});
