import type { Chore, DayOfWeek } from "./types";
import {
  WEEKDAY_CODES,
  addCalendarDays,
  addCalendarMonths,
  clampDayOfMonth,
  diffInCalendarDays,
  formatLocalDate,
  maxDate,
  minDate,
  parseLocalDate,
  startOfMonth,
  startOfWeekSunday,
  weekdayCode,
} from "./dates";

const SAFETY_MAX_MONTHS = 2400; // 200 years

/**
 * Every occurrence date (`YYYY-MM-DD`) a chore template produces within [rangeStart, rangeEnd],
 * inclusive on both ends. A missed occurrence never shifts later ones — each date is derived
 * independently from `StartDate`, never from the previous occurrence.
 */
export function generateOccurrences(chore: Chore, rangeStart: string, rangeEnd: string): string[] {
  if (rangeEnd < rangeStart) return [];

  if (chore.repeatMode === "none") {
    return inRange(chore.startDate, rangeStart, rangeEnd) ? [chore.startDate] : [];
  }

  if (chore.repeatMode === "after_completion") {
    const date = chore.nextDueDate ?? chore.startDate;
    return inRange(date, rangeStart, rangeEnd) ? [date] : [];
  }

  switch (chore.frequency) {
    case "daily":
      return dailyOccurrences(chore, rangeStart, rangeEnd);
    case "weekly":
      return weeklyOccurrences(chore, rangeStart, rangeEnd);
    case "monthly":
      return monthlyOccurrences(chore, rangeStart, rangeEnd);
    default:
      return [];
  }
}

/** The next `count` occurrence dates on or after `fromDate`, for recurrence-form previews. */
export function getNextOccurrences(chore: Chore, fromDate: string, count: number): string[] {
  if (chore.repeatMode !== "schedule") {
    const single = generateOccurrences(chore, fromDate, "9999-12-31");
    return single.slice(0, count);
  }

  const results: string[] = [];
  let windowEnd = parseLocalDate(fromDate);
  let iterations = 0;
  while (results.length < count && iterations < SAFETY_MAX_MONTHS) {
    windowEnd = addCalendarMonths(windowEnd, 6);
    const end = chore.endDate && parseLocalDate(chore.endDate) < windowEnd ? chore.endDate : formatLocalDate(windowEnd);
    results.length = 0;
    results.push(...generateOccurrences(chore, fromDate, end));
    if (chore.endDate && end === chore.endDate) break;
    iterations++;
  }
  return results.slice(0, count);
}

function inRange(date: string, rangeStart: string, rangeEnd: string): boolean {
  return date >= rangeStart && date <= rangeEnd;
}

function effectiveRange(chore: Chore, rangeStart: string, rangeEnd: string) {
  const start = parseLocalDate(chore.startDate);
  const end = chore.endDate ? parseLocalDate(chore.endDate) : null;
  const rangeStartDate = parseLocalDate(rangeStart);
  const rangeEndDate = parseLocalDate(rangeEnd);
  const loopStart = maxDate(start, rangeStartDate);
  const loopEnd = end ? minDate(rangeEndDate, end) : rangeEndDate;
  return { start, end, loopStart, loopEnd };
}

function dailyOccurrences(chore: Chore, rangeStart: string, rangeEnd: string): string[] {
  const interval = Math.max(1, chore.interval ?? 1);
  const { start, loopStart, loopEnd } = effectiveRange(chore, rangeStart, rangeEnd);
  const results: string[] = [];
  if (loopStart > loopEnd) return results;

  // An empty (or absent) DaysOfWeek means every day; otherwise the every-N-days sequence is
  // filtered down to the chosen weekdays, so "daily on weekdays" skips the weekend instead of
  // shifting onto it.
  const dayIndices =
    chore.daysOfWeek && chore.daysOfWeek.length > 0
      ? new Set(chore.daysOfWeek.map((d) => WEEKDAY_CODES.indexOf(d)))
      : null;

  for (let d = loopStart; d <= loopEnd; d = addCalendarDays(d, 1)) {
    if (dayIndices && !dayIndices.has(d.getDay())) continue;
    const diff = diffInCalendarDays(d, start);
    if (diff >= 0 && diff % interval === 0) {
      results.push(formatLocalDate(d));
    }
  }
  return results;
}

function weeklyOccurrences(chore: Chore, rangeStart: string, rangeEnd: string): string[] {
  const interval = Math.max(1, chore.interval ?? 1);
  const { start, loopStart, loopEnd } = effectiveRange(chore, rangeStart, rangeEnd);
  if (loopStart > loopEnd) return [];

  const days: DayOfWeek[] =
    chore.daysOfWeek && chore.daysOfWeek.length > 0 ? chore.daysOfWeek : [weekdayCode(start)];
  const dayIndices = new Set(days.map((d) => WEEKDAY_CODES.indexOf(d)));
  const startWeek = startOfWeekSunday(start);

  const results: string[] = [];
  for (let d = loopStart; d <= loopEnd; d = addCalendarDays(d, 1)) {
    if (d < start) continue;
    if (!dayIndices.has(d.getDay())) continue;
    const weekOfDay = startOfWeekSunday(d);
    const weekIndex = diffInCalendarDays(weekOfDay, startWeek) / 7;
    if (weekIndex >= 0 && weekIndex % interval === 0) {
      results.push(formatLocalDate(d));
    }
  }
  return results;
}

function monthlyOccurrences(chore: Chore, rangeStart: string, rangeEnd: string): string[] {
  const interval = Math.max(1, chore.interval ?? 1);
  const { start, loopEnd } = effectiveRange(chore, rangeStart, rangeEnd);
  const rangeStartDate = parseLocalDate(rangeStart);
  const startDay = start.getDate();
  const startMonth = startOfMonth(start);

  const results: string[] = [];
  let monthIndex = 0;
  while (monthIndex < SAFETY_MAX_MONTHS) {
    const monthStart = addCalendarMonths(startMonth, monthIndex);
    if (monthIndex % interval === 0) {
      const target = clampDayOfMonth(monthStart, startDay);
      if (target > loopEnd) break;
      if (target >= start && target >= rangeStartDate) {
        results.push(formatLocalDate(target));
      }
    }
    monthIndex++;
  }
  return results;
}
