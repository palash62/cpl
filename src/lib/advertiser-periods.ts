import {
  endOfDay,
  endOfMonth,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
} from "date-fns";

export const ADVERTISER_PERIODS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7", label: "Last 7 Days" },
  { value: "last30", label: "Last 30 Days" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
] as const;

export type AdvertiserPeriod = (typeof ADVERTISER_PERIODS)[number]["value"];

export function parseAdvertiserPeriod(value?: string): AdvertiserPeriod {
  if (ADVERTISER_PERIODS.some((p) => p.value === value)) {
    return value as AdvertiserPeriod;
  }
  return "last30";
}

export function getAdvertiserPeriodRange(period: AdvertiserPeriod) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  switch (period) {
    case "today":
      return {
        from: todayStart,
        to: todayEnd,
        prevFrom: startOfDay(subDays(now, 1)),
        prevTo: endOfDay(subDays(now, 1)),
      };
    case "yesterday": {
      const day = subDays(now, 1);
      return {
        from: startOfDay(day),
        to: endOfDay(day),
        prevFrom: startOfDay(subDays(now, 2)),
        prevTo: endOfDay(subDays(now, 2)),
      };
    }
    case "last7":
      return {
        from: startOfDay(subDays(now, 6)),
        to: todayEnd,
        prevFrom: startOfDay(subDays(now, 13)),
        prevTo: endOfDay(subDays(now, 7)),
      };
    case "last30":
      return {
        from: startOfDay(subDays(now, 29)),
        to: todayEnd,
        prevFrom: startOfDay(subDays(now, 59)),
        prevTo: endOfDay(subDays(now, 30)),
      };
    case "this_month":
      return {
        from: startOfMonth(now),
        to: todayEnd,
        prevFrom: startOfMonth(subMonths(now, 1)),
        prevTo: endOfMonth(subMonths(now, 1)),
      };
    case "last_month": {
      const lastMonth = subMonths(now, 1);
      return {
        from: startOfMonth(lastMonth),
        to: endOfMonth(lastMonth),
        prevFrom: startOfMonth(subMonths(now, 2)),
        prevTo: endOfMonth(subMonths(now, 2)),
      };
    }
  }
}

export function calcTrend(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}
