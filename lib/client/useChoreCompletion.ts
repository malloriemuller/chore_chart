"use client";

import { useRef, useState } from "react";
import type { KeyedMutator } from "swr";
import { withOccurrenceDone, withOccurrenceUndone } from "./boardOptimism";
import type { OccurrenceStatus } from "@/lib/domain/types";
import type { BoardResponse } from "@/lib/server/board";

const UNDO_WINDOW_MS = 5_000;
const ERROR_TOAST_MS = 4_000;

export interface PendingUndo {
  choreId: string;
  occurrenceDate: string;
  profileId: string;
  stars: number;
  priorStatus: OccurrenceStatus;
  completionId: string;
  previousNextDueDate?: string;
  message: string;
}

/** Shared check-off/undo mutation logic for the Today and Week boards. */
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

          setPendingUndo({
            choreId,
            occurrenceDate,
            profileId,
            stars: chore.stars,
            priorStatus: status,
            completionId: body.completion.id,
            previousNextDueDate: body.previousNextDueDate,
            message: `${chore.emoji ?? ""} ${chore.title}`.trim(),
          });
          undoTimer.current = setTimeout(() => setPendingUndo(null), UNDO_WINDOW_MS);

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
            body: JSON.stringify({ completionId: undo.completionId, previousNextDueDate: undo.previousNextDueDate }),
          });
          if (!response.ok) throw new Error("Failed to undo");
          return current ? withOccurrenceUndone(current, undo) : current;
        },
        {
          optimisticData: withOccurrenceUndone(data, undo),
          rollbackOnError: true,
          revalidate: true,
        },
      );
    } catch {
      flashError("Couldn't undo that. Try again.");
    }
  }

  return { pendingUndo, handleToggle, handleUndo, error };
}
