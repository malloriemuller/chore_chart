import { updateChore } from "../airtable/repositories/chores";
import { createCompletions } from "../airtable/repositories/completions";
import { dismissOccurrence } from "../domain/completions";
import type { Chore, Completion } from "../domain/types";

export interface Dismissal {
  completion: Completion;
  /** The `after_completion` chore's `NextDueDate` before this dismissal, to support undo. */
  previousNextDueDate?: string;
}

/**
 * Settles each occurrence for no stars, writing the records in one batch. An `after_completion`
 * chore also gets its clock restarted from today, so skipping brings it back in `delayDays`
 * rather than retiring it. Occurrences already settled are left exactly as they are.
 */
export async function dismissOccurrences(
  occurrences: { chore: Chore; occurrenceDate: string }[],
  profileId: string,
  today: string,
  existingCompletions: Completion[],
): Promise<Dismissal[]> {
  const pending: {
    choreId: string;
    record: Omit<Completion, "id">;
    previousNextDueDate?: string;
    nextDueDate?: string;
  }[] = [];

  for (const { chore, occurrenceDate } of occurrences) {
    const result = dismissOccurrence({
      chore,
      profileId,
      occurrenceDate,
      today,
      existingCompletions,
      newId: () => "pending",
    });
    if (result.alreadyCompleted) continue;

    const { completion } = result;
    pending.push({
      choreId: chore.id,
      record: {
        key: completion.key,
        choreId: completion.choreId,
        profileId: completion.profileId,
        occurrenceDate: completion.occurrenceDate,
        completedDate: completion.completedDate,
        starsAwarded: completion.starsAwarded,
        dismissed: completion.dismissed,
      },
      previousNextDueDate: result.previousNextDueDate,
      // Only `after_completion` chores carry a next due date, and each of those has at most one
      // date in play, so no two records here ever push the same chore's clock.
      nextDueDate: chore.repeatMode === "after_completion" ? result.nextNextDueDate : undefined,
    });
  }

  const created = await createCompletions(pending.map((p) => p.record));

  for (const entry of pending) {
    if (entry.nextDueDate) await updateChore(entry.choreId, { nextDueDate: entry.nextDueDate });
  }

  return created.map((completion, index) => ({
    completion,
    previousNextDueDate: pending[index].previousNextDueDate,
  }));
}
