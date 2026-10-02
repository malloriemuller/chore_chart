import type { DayOfWeek } from "./types";

export const WEEKDAY_CODES: DayOfWeek[] = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

/** Parses a `YYYY-MM-DD` string as a local calendar date (midnight, no timezone attached). */
export function parseLocalDate(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function weekdayCode(date: Date): DayOfWeek {
  return WEEKDAY_CODES[date.getDay()];
}

export function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function startOfWeekSunday(date: Date): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() - result.getDay());
  return result;
}

export function addCalendarDays(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

export function addCalendarMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

/** Whole-day difference, immune to DST hour shifts since both dates are local midnight. */
export function diffInCalendarDays(a: Date, b: Date): number {
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcA - utcB) / 86_400_000);
}

export function maxDate(a: Date, b: Date): Date {
  return a > b ? a : b;
}

export function minDate(a: Date, b: Date): Date {
  return a < b ? a : b;
}

export function clampDayOfMonth(monthStart: Date, day: number): Date {
  const clampedDay = Math.min(day, daysInMonth(monthStart));
  return new Date(monthStart.getFullYear(), monthStart.getMonth(), clampedDay);
}
