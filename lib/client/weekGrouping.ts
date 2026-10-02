import type { Chore } from "@/lib/domain/types";
import type { BoardOccurrence } from "@/lib/server/board";
import { type BoardRow, rowsForProfile, sortRows } from "./boardGrouping";

export interface WeekDay {
  date: string;
  rows: BoardRow[];
}

/**
 * One cell per day. Today's cell also carries any carried-over overdue item(s), since
 * check-off (per the spec) is limited to today and overdue regardless of which cell they sit in.
 */
export function groupWeekForProfile(
  profileId: string,
  occurrences: BoardOccurrence[],
  chores: Chore[],
  weekDates: string[],
  today: string,
): WeekDay[] {
  const rows = rowsForProfile(profileId, occurrences, chores);
  const overdue = rows.filter((r) => r.occurrence.status === "overdue");

  return weekDates.map((date) => {
    const dayRows =
      date === today
        ? [...overdue, ...rows.filter((r) => r.occurrence.occurrenceDate === date && r.occurrence.status !== "overdue")]
        : rows.filter((r) => r.occurrence.occurrenceDate === date);
    return { date, rows: sortRows(dayRows) };
  });
}
