import type { BoardResponse } from "@/lib/server/board";
import type { OccurrenceStatus } from "@/lib/domain/types";

export function withOccurrenceDone(
  board: BoardResponse,
  args: { choreId: string; occurrenceDate: string; profileId: string; stars: number; completionId: string },
): BoardResponse {
  const { choreId, occurrenceDate, profileId, stars, completionId } = args;
  return {
    ...board,
    occurrences: board.occurrences.map((o) =>
      o.choreId === choreId && o.occurrenceDate === occurrenceDate ? { ...o, status: "done" as const } : o,
    ),
    completions: [
      ...board.completions,
      { id: completionId, key: `${choreId}:${occurrenceDate}`, choreId, profileId, occurrenceDate, completedDate: board.today, starsAwarded: stars },
    ],
    balances: { ...board.balances, [profileId]: (board.balances[profileId] ?? 0) + stars },
  };
}

export function withOccurrenceUndone(
  board: BoardResponse,
  args: {
    choreId: string;
    occurrenceDate: string;
    profileId: string;
    stars: number;
    priorStatus: OccurrenceStatus;
  },
): BoardResponse {
  const { choreId, occurrenceDate, profileId, stars, priorStatus } = args;
  return {
    ...board,
    occurrences: board.occurrences.map((o) =>
      o.choreId === choreId && o.occurrenceDate === occurrenceDate ? { ...o, status: priorStatus } : o,
    ),
    completions: board.completions.filter(
      (c) => !(c.choreId === choreId && c.occurrenceDate === occurrenceDate),
    ),
    balances: { ...board.balances, [profileId]: (board.balances[profileId] ?? 0) - stars },
  };
}
