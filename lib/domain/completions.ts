import type { Chore, Completion } from "./types";
import { addCalendarDays, formatLocalDate, parseLocalDate } from "./dates";
import { completionKey, findCompletion } from "./status";

export interface SettleOccurrenceResult {
  completion: Completion;
  /** For `after_completion` chores: the chore's `NextDueDate` before this record, to support undo. */
  previousNextDueDate?: string;
  /** For `after_completion` chores: the new `NextDueDate` to persist on the chore. */
  nextNextDueDate?: string;
  /** A record for this chore and date already existed; `completion` is that record, untouched. */
  alreadyCompleted: boolean;
}

export interface SettleOccurrenceParams {
  chore: Chore;
  profileId: string;
  occurrenceDate: string;
  today: string;
  existingCompletions: Completion[];
  newId: () => string;
}

/**
 * Settling an occurrence is idempotent: if a Completion with this Key already
 * exists, it is returned unchanged rather than duplicated.
 */
function settleOccurrence(params: SettleOccurrenceParams, dismissed: boolean): SettleOccurrenceResult {
  const { chore, profileId, occurrenceDate, today, existingCompletions, newId } = params;
  const existing = findCompletion(chore.id, occurrenceDate, existingCompletions);
  if (existing) {
    return { completion: existing, alreadyCompleted: true };
  }

  const completion: Completion = {
    id: newId(),
    key: completionKey(chore.id, occurrenceDate),
    choreId: chore.id,
    profileId,
    occurrenceDate,
    completedDate: today,
    starsAwarded: dismissed ? 0 : chore.stars,
    dismissed,
  };

  if (chore.repeatMode === "after_completion") {
    return {
      completion,
      previousNextDueDate: chore.nextDueDate,
      nextNextDueDate: nextDueDateAfterCompletion(chore, today),
      alreadyCompleted: false,
    };
  }

  return { completion, alreadyCompleted: false };
}

export function completeOccurrence(params: SettleOccurrenceParams): SettleOccurrenceResult {
  return settleOccurrence(params, false);
}

/**
 * Waves an occurrence off: it stops being due or overdue and earns no stars. An
 * `after_completion` chore still gets its clock restarted from today, so dismissing today's
 * "water the plants" brings it back in `delayDays`, rather than retiring it for good.
 */
export function dismissOccurrence(params: SettleOccurrenceParams): SettleOccurrenceResult {
  return settleOccurrence(params, true);
}

export function nextDueDateAfterCompletion(chore: Chore, completedDate: string): string {
  return formatLocalDate(addCalendarDays(parseLocalDate(completedDate), chore.delayDays ?? 0));
}

/** Undo is only allowed on a completion made today; it cannot rewrite history. */
export function canUndo(completion: Completion, today: string): boolean {
  return completion.completedDate === today;
}
