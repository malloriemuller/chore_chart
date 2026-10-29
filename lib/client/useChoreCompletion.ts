"use client";

import { useRef, useState } from "react";
import type { KeyedMutator } from "swr";
import { type UndoEntry, withOccurrenceDismissed, withOccurrenceDone, withOccurrencesUndone } from "./boardOptimism";
import type { BoardResponse } from "@/lib/server/board";

const UNDO_WINDOW_MS = 5_000;
const ERROR_TOAST_MS = 4_000;

export interface PendingUndo {
  entries: (UndoEntry & { completionId: string; previousNextDueDate?: string })[];
  /** Ready to show as-is, e.g. "🧹 Sweep done!" or "12 chores skipped". */
  message: string;
}

/** Shared check-off / skip / undo mutation logic for the Today and Week boards. */
export function useChoreCompletion(data: BoardResponse | undefined, mutate: KeyedMutator<BoardResponse>) {
  const [pendingUndo, setPendingUndo] = useState<PendingUndo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function flashError(message: string) {
    if (errorTimer.current) clearTimeout(errorTimer.current);
    setError(message);
    errorTimer.current = setTimeout(() => setError(null), ERROR_TOAST_MS);
  }

  function armUndo(undo: PendingUndo) {
    setPendingUndo(undo);
    undoTimer.current = setTimeout(() => setPendingUndo(null), UNDO_WINDOW_MS);
  }

  interface DismissalResponse {
    dismissals: {
      completion: { id: string; choreId: string; occurrenceDate: string };
      previousNextDueDate?: string;
    }[];
  }

  /**
   * A skip can settle more than the tapped card: an overdue chore's older misses go with it. Those
   * extra dates aren't on screen, so they only land once the server says which they were.
   */
  function applyDismissals(board: BoardResponse, { dismissals }: DismissalResponse): BoardResponse {
    return dismissals.reduce(
      (acc, { completion }) =>
        withOccurrenceDismissed(acc, {
          choreId: completion.choreId,
          occurrenceDate: completion.occurrenceDate,
          profileId: board.chores.find((c) => c.id === completion.choreId)?.assigneeId ?? "",
          stars: 0,
          completionId: completion.id,
        }),
      board,
    );
  }

  function undoEntriesFor(board: BoardResponse, { dismissals }: DismissalResponse) {
    return dismissals.map(({ completion, previousNextDueDate }) => ({
      choreId: completion.choreId,
      occurrenceDate: completion.occurrenceDate,
      profileId: board.chores.find((c) => c.id === completion.choreId)?.assigneeId ?? "",
      stars: 0,
      priorStatus:
        board.occurrences.find(
          (o) => o.choreId === completion.choreId && o.occurrenceDate === completion.occurrenceDate,
        )?.status ?? ("missed" as const),
      completionId: completion.id,
      previousNextDueDate,
    }));
  }

  async function handleToggle(choreId: string, occurrenceDate: string, status: "due" | "overdue") {
    if (!data) return;
    const chore = data.chores.find((c) => c.id === choreId);
    const occurrence = data.occurrences.find(
      (o) => o.choreId === choreId && o.occurrenceDate === occurrenceDate,
    );
    if (!chore || !occurrence || occurrence.status === "done") return;
    if (!navigator.onLine) return; // offline: check-offs are paused until the connection returns

    const profileId = chore.assigneeId;
    const tempId = `optimistic-${choreId}-${occurrenceDate}`;
    if (undoTimer.current) clearTimeout(undoTimer.current);

    try {
      await mutate(
        async (current) => {
          const response = await fetch("/api/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ choreId, profileId, occurrenceDate }),
          });
          if (!response.ok) throw new Error("Failed to complete chore");
          const body = (await response.json()) as {
            completion: { id: string };
            previousNextDueDate?: string;
          };

          armUndo({
            entries: [
              {
                choreId,
                occurrenceDate,
                profileId,
                stars: chore.stars,
                priorStatus: status,
                completionId: body.completion.id,
                previousNextDueDate: body.previousNextDueDate,
              },
            ],
            message: `${`${chore.emoji ?? ""} ${chore.title}`.trim()} done!`,
          });

          return current
            ? withOccurrenceDone(current, {
                choreId,
                occurrenceDate,
                profileId,
                stars: chore.stars,
                completionId: body.completion.id,
              })
            : current;
        },
        {
          optimisticData: withOccurrenceDone(data, {
            choreId,
            occurrenceDate,
            profileId,
            stars: chore.stars,
            completionId: tempId,
          }),
          rollbackOnError: true,
          revalidate: true,
        },
      );
    } catch {
      flashError("Couldn't save that. Try again.");
    }
  }

  /** Waves one chore off: it stops coming back, and no stars are earned for it. */
  async function handleDismiss(choreId: string, occurrenceDate: string) {
    if (!data) return;
    const chore = data.chores.find((c) => c.id === choreId);
    const occurrence = data.occurrences.find(
      (o) => o.choreId === choreId && o.occurrenceDate === occurrenceDate,
    );
    if (!chore || !occurrence || occurrence.status === "done" || occurrence.status === "dismissed") return;
    if (!navigator.onLine) return; // offline: board changes are paused until the connection returns

    const profileId = chore.assigneeId;
    const tempId = `optimistic-skip-${choreId}-${occurrenceDate}`;
    if (undoTimer.current) clearTimeout(undoTimer.current);

    try {
      await mutate(
        async (current) => {
          const response = await fetch("/api/completions/dismiss", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ choreId, profileId, occurrenceDate }),
          });
          if (!response.ok) throw new Error("Failed to skip chore");
          const body = (await response.json()) as DismissalResponse;

          if (body.dismissals.length > 0) {
            armUndo({
              entries: undoEntriesFor(data, body),
              message: `${`${chore.emoji ?? ""} ${chore.title}`.trim()} skipped`,
            });
          }

          return current ? applyDismissals(current, body) : current;
        },
        {
          optimisticData: withOccurrenceDismissed(data, {
            choreId,
            occurrenceDate,
            profileId,
            stars: 0,
            completionId: tempId,
          }),
          rollbackOnError: true,
          revalidate: true,
        },
      );
    } catch {
      flashError("Couldn't skip that. Try again.");
    }
  }

  /** The backlog a break leaves behind: every carried-forward chore for one kid, waved off at once. */
  async function handleClearOverdue(profileId: string) {
    if (!data) return;
    if (!navigator.onLine) return;

    const choreById = new Map(data.chores.map((c) => [c.id, c]));
    const overdue = data.occurrences.filter(
      (o) => o.status === "overdue" && choreById.get(o.choreId)?.assigneeId === profileId,
    );
    if (overdue.length === 0) return;

    if (undoTimer.current) clearTimeout(undoTimer.current);

    try {
      await mutate(
        async (current) => {
          const response = await fetch("/api/completions/dismiss-overdue", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ profileId }),
          });
          if (!response.ok) throw new Error("Failed to clear overdue chores");
          const body = (await response.json()) as DismissalResponse;

          const chores = new Set(body.dismissals.map(({ completion }) => completion.choreId));
          if (chores.size > 0) {
            armUndo({
              entries: undoEntriesFor(data, body),
              message: `${chores.size} ${chores.size === 1 ? "chore" : "chores"} skipped`,
            });
          }

          return current ? applyDismissals(current, body) : current;
        },
        {
          optimisticData: overdue.reduce(
            (acc, o) =>
              withOccurrenceDismissed(acc, {
                choreId: o.choreId,
                occurrenceDate: o.occurrenceDate,
                profileId,
                stars: 0,
                completionId: `optimistic-skip-${o.choreId}-${o.occurrenceDate}`,
              }),
            data,
          ),
          rollbackOnError: true,
          revalidate: true,
        },
      );
    } catch {
      flashError("Couldn't clear those. Try again.");
    }
  }

  async function handleUndo() {
    if (!pendingUndo || !data) return;
    const undo = pendingUndo;
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setPendingUndo(null);

    try {
      await mutate(
        async (current) => {
          const response = await fetch("/api/completions/undo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              completions: undo.entries.map(({ completionId, previousNextDueDate }) => ({
                completionId,
                previousNextDueDate,
              })),
            }),
          });
          if (!response.ok) throw new Error("Failed to undo");
          return current ? withOccurrencesUndone(current, undo.entries) : current;
        },
        {
          optimisticData: withOccurrencesUndone(data, undo.entries),
          rollbackOnError: true,
          revalidate: true,
        },
      );
    } catch {
      flashError("Couldn't undo that. Try again.");
    }
  }

  return { pendingUndo, handleToggle, handleDismiss, handleClearOverdue, handleUndo, error };
}
