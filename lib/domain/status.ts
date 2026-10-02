import type { Chore, Completion, OccurrenceStatus } from "./types";
import { addCalendarDays, formatLocalDate, parseLocalDate } from "./dates";
import { generateOccurrences } from "./occurrences";

const OVERDUE_LOOKBACK_DAYS = 7;

export function completionKey(choreId: string, occurrenceDate: string): string {
  return `${choreId}:${occurrenceDate}`;
}

export function findCompletion(
  choreId: string,
  occurrenceDate: string,
  completions: Completion[],
): Completion | undefined {
  const key = completionKey(choreId, occurrenceDate);
  return completions.find((c) => c.key === key);
}

export function statusForOccurrence(
  occurrenceDate: string,
  today: string,
  completed: boolean,
): OccurrenceStatus {
  if (completed) return "done";
  if (occurrenceDate === today) return "due";
  if (occurrenceDate > today) return "upcoming";
  return "overdue";
}

/**
 * The single overdue occurrence date for a chore as of `today`, or null if none.
 * - `none` / `after_completion`: the live occurrence persists as overdue indefinitely.
 * - `schedule`: only the 7 days before `today` are considered, and only the most
 *   recent missed occurrence is kept — older misses silently drop off.
 */
export function getOverdueOccurrenceDate(
  chore: Chore,
  completions: Completion[],
  today: string,
): string | null {
  if (chore.repeatMode === "none" || chore.repeatMode === "after_completion") {
    const date = chore.repeatMode === "none" ? chore.startDate : chore.nextDueDate ?? chore.startDate;
    if (date < today && !findCompletion(chore.id, date, completions)) return date;
    return null;
  }

  const todayDate = parseLocalDate(today);
  const lookbackStart = formatLocalDate(addCalendarDays(todayDate, -OVERDUE_LOOKBACK_DAYS));
  const dayBeforeToday = formatLocalDate(addCalendarDays(todayDate, -1));
  if (dayBeforeToday < lookbackStart) return null;

  const missed = generateOccurrences(chore, lookbackStart, dayBeforeToday)
    .filter((date) => !findCompletion(chore.id, date, completions))
    .sort();

  return missed.length > 0 ? missed[missed.length - 1] : null;
}
