import type { Chore, Completion } from "./types";
import { addCalendarDays, formatLocalDate, parseLocalDate } from "./dates";
import { completionKey, findCompletion } from "./status";

export interface CompleteOccurrenceResult {
  completion: Completion;
  /** For `after_completion` chores: the chore's `NextDueDate` before this completion, to support undo. */
  previousNextDueDate?: string;
  /** For `after_completion` chores: the new `NextDueDate` to persist on the chore. */
  nextNextDueDate?: string;
  alreadyCompleted: boolean;
}

/**
 * Completing an occurrence is idempotent: if a Completion with this Key already
 * exists, it is returned unchanged rather than duplicated.
 */
export function completeOccurrence(params: {
  chore: Chore;
  profileId: string;
  occurrenceDate: string;
  today: string;
  existingCompletions: Completion[];
  newId: () => string;
}): CompleteOccurrenceResult {
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
    starsAwarded: chore.stars,
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

export function nextDueDateAfterCompletion(chore: Chore, completedDate: string): string {
  return formatLocalDate(addCalendarDays(parseLocalDate(completedDate), chore.delayDays ?? 0));
}

/** Undo is only allowed on a completion made today; it cannot rewrite history. */
export function canUndo(completion: Completion, today: string): boolean {
  return completion.completedDate === today;
}
