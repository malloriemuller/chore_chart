import { listAllCompletions } from "../airtable/repositories/completions";
import { listActiveChores } from "../airtable/repositories/chores";
import { listActiveProfiles } from "../airtable/repositories/profiles";
import { listAllRedemptions } from "../airtable/repositories/redemptions";
import { getHouseholdToday } from "../domain/clock";
import { generateOccurrences } from "../domain/occurrences";
import { findCompletion, getOverdueOccurrenceDate, statusForOccurrence } from "../domain/status";
import { computeBalance } from "../domain/stars";
import type { Chore, Completion, OccurrenceStatus, Profile } from "../domain/types";
import { getHouseholdTz } from "./env";

export interface BoardOccurrence {
  choreId: string;
  occurrenceDate: string;
  status: OccurrenceStatus;
}

export interface BoardResponse {
  today: string;
  profiles: Profile[];
  chores: Chore[];
  occurrences: BoardOccurrence[];
  completions: Completion[];
  balances: Record<string, number>;
}

/**
 * The occurrence dates a single chore should surface on the board within [rangeStart, rangeEnd]:
 * due/upcoming dates in range, done dates in range (so history stays visible), and the one
 * current overdue date (if any) even when it falls outside the viewed range. Any other
 * incomplete past occurrence is silently dropped, per the 7-day/most-recent-miss rule.
 */
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function choreOccurrenceDates(
  chore: Chore,
  completions: Completion[],
  today: string,
  rangeStart: string,
  rangeEnd: string,
): string[] {
  // A chore hand-edited in Airtable can be missing StartDate entirely; occurrence math
  // assumes it's always a valid YYYY-MM-DD, so treat anything else as "no occurrences yet"
  // rather than letting it throw and take down the whole board.
  if (!DATE_PATTERN.test(chore.startDate)) return [];

  const overdueDate = getOverdueOccurrenceDate(chore, completions, today);
  const rangeDates = generateOccurrences(chore, rangeStart, rangeEnd);

  const dates = new Set<string>();
  for (const date of rangeDates) {
    const completed = Boolean(findCompletion(chore.id, date, completions));
    if (date < today && !completed && date !== overdueDate) continue;
    dates.add(date);
  }
  if (overdueDate) dates.add(overdueDate);

  return [...dates].sort();
}

export async function getBoardData(rangeStart: string, rangeEnd: string): Promise<BoardResponse> {
  const today = getHouseholdToday(getHouseholdTz());

  const [profiles, chores, completions, redemptions] = await Promise.all([
    listActiveProfiles(),
    listActiveChores(),
    listAllCompletions(),
    listAllRedemptions(),
  ]);

  const occurrences: BoardOccurrence[] = chores.flatMap((chore) =>
    choreOccurrenceDates(chore, completions, today, rangeStart, rangeEnd).map((occurrenceDate) => ({
      choreId: chore.id,
      occurrenceDate,
      status: statusForOccurrence(
        occurrenceDate,
        today,
        Boolean(findCompletion(chore.id, occurrenceDate, completions)),
      ),
    })),
  );

  const inRangeCompletions = completions.filter(
    (c) => c.occurrenceDate >= rangeStart && c.occurrenceDate <= rangeEnd,
  );

  const balances: Record<string, number> = {};
  for (const profile of profiles) {
    balances[profile.id] = computeBalance(profile.id, completions, redemptions);
  }

  return { today, profiles, chores, occurrences, completions: inRangeCompletions, balances };
}
