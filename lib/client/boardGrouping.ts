import type { Chore, TimeOfDay } from "@/lib/domain/types";
import type { BoardOccurrence } from "@/lib/server/board";

export const TIME_OF_DAY_ORDER: TimeOfDay[] = ["morning", "afternoon", "evening", "anytime"];

export const TIME_OF_DAY_LABELS: Record<TimeOfDay, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  anytime: "Anytime",
};

export interface BoardRow {
  chore: Chore;
  occurrence: BoardOccurrence;
}

export interface ProfileSection {
  time: TimeOfDay;
  label: string;
  rows: BoardRow[];
}

export interface ProfileBoard {
  overdue: BoardRow[];
  sections: ProfileSection[];
}

export function sortRows(rows: BoardRow[]): BoardRow[] {
  return [...rows].sort((a, b) => {
    const aDone = a.occurrence.status === "done";
    const bDone = b.occurrence.status === "done";
    if (aDone !== bDone) return aDone ? 1 : -1;
    const timeCompare = (a.chore.dueTime ?? "").localeCompare(b.chore.dueTime ?? "");
    if (timeCompare !== 0) return timeCompare;
    return a.chore.title.localeCompare(b.chore.title);
  });
}

export function rowsForProfile(profileId: string, occurrences: BoardOccurrence[], chores: Chore[]): BoardRow[] {
  const choreMap = new Map(chores.map((c) => [c.id, c]));
  const rows: BoardRow[] = [];
  for (const occurrence of occurrences) {
    const chore = choreMap.get(occurrence.choreId);
    if (chore && chore.assigneeId === profileId) rows.push({ chore, occurrence });
  }
  return rows;
}

export function groupBoardForProfile(
  profileId: string,
  occurrences: BoardOccurrence[],
  chores: Chore[],
): ProfileBoard {
  const rows = rowsForProfile(profileId, occurrences, chores);

  const overdue = sortRows(rows.filter((r) => r.occurrence.status === "overdue"));

  const sections: ProfileSection[] = TIME_OF_DAY_ORDER.map((time) => ({
    time,
    label: TIME_OF_DAY_LABELS[time],
    rows: sortRows(rows.filter((r) => r.occurrence.status !== "overdue" && r.chore.timeOfDay === time)),
  })).filter((section) => section.rows.length > 0);

  return { overdue, sections };
}
