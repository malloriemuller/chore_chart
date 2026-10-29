import type { BoardOccurrence, BoardResponse } from "@/lib/server/board";
import type { Completion, OccurrenceStatus } from "@/lib/domain/types";

export interface UndoEntry {
  choreId: string;
  occurrenceDate: string;
  profileId: string;
  stars: number;
  priorStatus: OccurrenceStatus;
}

function completionRecord(
  board: BoardResponse,
  args: { choreId: string; occurrenceDate: string; profileId: string; stars: number; completionId: string },
  dismissed: boolean,
): Completion {
  return {
    id: args.completionId,
    key: `${args.choreId}:${args.occurrenceDate}`,
    choreId: args.choreId,
    profileId: args.profileId,
    occurrenceDate: args.occurrenceDate,
    completedDate: board.today,
    starsAwarded: dismissed ? 0 : args.stars,
    dismissed,
  };
}

export function withOccurrenceDone(
  board: BoardResponse,
  args: { choreId: string; occurrenceDate: string; profileId: string; stars: number; completionId: string },
): BoardResponse {
  const { choreId, occurrenceDate, profileId, stars } = args;
  return {
    ...board,
    occurrences: board.occurrences.map((o) =>
      o.choreId === choreId && o.occurrenceDate === occurrenceDate ? { ...o, status: "done" as const } : o,
    ),
    completions: [...board.completions, completionRecord(board, args, false)],
    balances: { ...board.balances, [profileId]: (board.balances[profileId] ?? 0) + stars },
  };
}

/**
 * A dismissed past occurrence leaves the board outright — it was only there because it was being
 * carried forward, and the server stops carrying it the moment it is settled. A dismissed
 * occurrence on its own day stays put, greyed out, as the record of a skipped day.
 */
export function withOccurrenceDismissed(
  board: BoardResponse,
  args: { choreId: string; occurrenceDate: string; profileId: string; stars: number; completionId: string },
): BoardResponse {
  const { choreId, occurrenceDate } = args;
  const isPast = occurrenceDate < board.today;
  const matches = (o: BoardOccurrence) => o.choreId === choreId && o.occurrenceDate === occurrenceDate;

  return {
    ...board,
    occurrences: isPast
      ? board.occurrences.filter((o) => !matches(o))
      : board.occurrences.map((o) => (matches(o) ? { ...o, status: "dismissed" as const } : o)),
    completions: [...board.completions, completionRecord(board, args, true)],
  };
}

/**
 * Rolls back check-offs and dismissals alike: each occurrence returns to the status it had, and is
 * put back if it had dropped off the board. `stars` is 0 for a dismissal, so only real check-offs
 * move the balance.
 */
export function withOccurrencesUndone(board: BoardResponse, entries: UndoEntry[]): BoardResponse {
  const settled = (choreId: string, occurrenceDate: string) =>
    entries.find((e) => e.choreId === choreId && e.occurrenceDate === occurrenceDate);

  const occurrences = board.occurrences.map((o) => {
    const entry = settled(o.choreId, o.occurrenceDate);
    return entry ? { ...o, status: entry.priorStatus } : o;
  });

  const restored = entries
    .filter((e) => !board.occurrences.some((o) => o.choreId === e.choreId && o.occurrenceDate === e.occurrenceDate))
    .map((e) => ({ choreId: e.choreId, occurrenceDate: e.occurrenceDate, status: e.priorStatus }));

  const balances = { ...board.balances };
  for (const entry of entries) {
    balances[entry.profileId] = (balances[entry.profileId] ?? 0) - entry.stars;
  }

  return {
    ...board,
    occurrences: [...occurrences, ...restored],
    completions: board.completions.filter((c) => !settled(c.choreId, c.occurrenceDate)),
    balances,
  };
}
