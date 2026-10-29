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

/**
 * `settlement` is the Completion record for this occurrence, if one exists: a real completion
 * makes it `done`, a dismissal makes it `dismissed`. `carriedOver` marks the one past date a chore
 * is actively dragging forward (see `getOverdueOccurrenceDate`). Any other past unsettled date is
 * `missed`: it stays visible on its own day as a record of what was skipped, but is never
 * actionable.
 */
export function statusForOccurrence(
  occurrenceDate: string,
  today: string,
  settlement: Completion | undefined,
  carriedOver = false,
): OccurrenceStatus {
  if (settlement) return settlement.dismissed ? "dismissed" : "done";
  if (occurrenceDate === today) return "due";
  if (occurrenceDate > today) return "upcoming";
  return carriedOver ? "overdue" : "missed";
}

/**
 * Every past occurrence date for a chore that is still unsettled and could yet be carried forward,
 * oldest first.
 * - `none` / `after_completion`: the live occurrence always persists. These have no next occurrence
 *   to fall back to — dropping the miss would retire the chore permanently — so `carryOver` does
 *   not apply to them.
 * - `schedule`: opt-in via `carryOver`. Off (the default) a missed day is simply gone, which is
 *   what a tied-to-its-own-day chore like brushing teeth wants. On, only the 7 days before
 *   `today` are considered — older misses silently drop off.
 *
 * Only the most recent of these is shown as overdue, but all of them are the chore's backlog:
 * skipping has to settle the lot, or waving off the most recent miss would just promote the one
 * before it.
 */
export function carriedForwardDates(chore: Chore, completions: Completion[], today: string): string[] {
  const unsettled = (date: string) => !findCompletion(chore.id, date, completions);

  if (chore.repeatMode === "none" || chore.repeatMode === "after_completion") {
    const date = chore.repeatMode === "none" ? chore.startDate : chore.nextDueDate ?? chore.startDate;
    return date < today && unsettled(date) ? [date] : [];
  }

  if (!chore.carryOver) return [];

  const todayDate = parseLocalDate(today);
  const lookbackStart = formatLocalDate(addCalendarDays(todayDate, -OVERDUE_LOOKBACK_DAYS));
  const dayBeforeToday = formatLocalDate(addCalendarDays(todayDate, -1));
  if (dayBeforeToday < lookbackStart) return [];

  return generateOccurrences(chore, lookbackStart, dayBeforeToday).filter(unsettled).sort();
}

/**
 * The single overdue occurrence date for a chore as of `today`, or null if none: the most recent
 * of its carried-forward dates. A dismissed date counts as settled just like a completed one, so
 * waving an occurrence off stops it carrying forward.
 */
export function getOverdueOccurrenceDate(
  chore: Chore,
  completions: Completion[],
  today: string,
): string | null {
  const dates = carriedForwardDates(chore, completions, today);
  return dates.length > 0 ? dates[dates.length - 1] : null;
}
