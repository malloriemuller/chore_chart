import { listAllBonuses } from "../airtable/repositories/bonuses";
import { listAllCompletions } from "../airtable/repositories/completions";
import { listActiveChores } from "../airtable/repositories/chores";
import { listActiveProfiles } from "../airtable/repositories/profiles";
import { listAllRedemptions } from "../airtable/repositories/redemptions";
import { getHouseholdToday } from "../domain/clock";
import { generateOccurrences } from "../domain/occurrences";
import {
  carriedForwardDates,
  findCompletion,
  getOverdueOccurrenceDate,
  statusForOccurrence,
} from "../domain/status";
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

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Every occurrence date a single chore produces within [rangeStart, rangeEnd], plus the one
 * current carried-over date (if any) even when it falls outside the viewed range. Past incomplete
 * dates are kept so they can render as `missed` on their own day; which of them is actionable is
 * decided by `statusForOccurrence`, not here.
 */
export function choreOccurrenceDates(
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

  const dates = new Set<string>(rangeDates);
  if (overdueDate) dates.add(overdueDate);

  return [...dates].sort();
}

export interface CarriedForwardOccurrence {
  chore: Chore;
  occurrenceDate: string;
}

/**
 * The whole backlog behind one profile's overdue pile: for each of their chores, every unsettled
 * past date still in play, not just the most recent one on show. Computed server-side so clearing
 * it can't be aimed at anything else.
 */
export function carriedForwardOccurrencesForProfile(
  profileId: string,
  chores: Chore[],
  completions: Completion[],
  today: string,
): CarriedForwardOccurrence[] {
  const occurrences: CarriedForwardOccurrence[] = [];
  for (const chore of chores) {
    if (chore.assigneeId !== profileId) continue;
    if (!DATE_PATTERN.test(chore.startDate)) continue;
    for (const occurrenceDate of carriedForwardDates(chore, completions, today)) {
      occurrences.push({ chore, occurrenceDate });
    }
  }
  return occurrences;
}

export async function getBoardData(rangeStart: string, rangeEnd: string): Promise<BoardResponse> {
  const today = getHouseholdToday(getHouseholdTz());

  const [profiles, chores, completions, redemptions, bonuses] = await Promise.all([
    listActiveProfiles(),
    listActiveChores(),
    listAllCompletions(),
    listAllRedemptions(),
    listAllBonuses(),
  ]);

  const occurrences: BoardOccurrence[] = chores.flatMap((chore) => {
    // Regenerating occurrences, so it is resolved once per chore rather than once per date.
    const overdueDate = getOverdueOccurrenceDate(chore, completions, today);
    return choreOccurrenceDates(chore, completions, today, rangeStart, rangeEnd).map((occurrenceDate) => ({
      choreId: chore.id,
      occurrenceDate,
      status: statusForOccurrence(
        occurrenceDate,
        today,
        findCompletion(chore.id, occurrenceDate, completions),
        overdueDate !== null && occurrenceDate === overdueDate,
      ),
    }));
  });

  const inRangeCompletions = completions.filter(
    (c) => c.occurrenceDate >= rangeStart && c.occurrenceDate <= rangeEnd,
  );

  const balances: Record<string, number> = {};
  for (const profile of profiles) {
    balances[profile.id] = computeBalance(profile.id, { completions, redemptions, bonuses });
  }

  return { today, profiles, chores, occurrences, completions: inRangeCompletions, balances };
}
