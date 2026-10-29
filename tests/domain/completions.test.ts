import { describe, expect, it } from "vitest";
import {
  canUndo,
  completeOccurrence,
  dismissOccurrence,
  nextDueDateAfterCompletion,
} from "../../lib/domain/completions";
import type { Chore, Completion } from "../../lib/domain/types";

function baseChore(overrides: Partial<Chore>): Chore {
  return {
    id: "chore-1",
    title: "Test chore",
    assigneeId: "profile-1",
    stars: 5,
    timeOfDay: "anytime",
    repeatMode: "none",
    startDate: "2026-01-01",
    archived: false,
    ...overrides,
  };
}

let idCounter = 0;
function newId() {
  idCounter += 1;
  return `id-${idCounter}`;
}

describe("completeOccurrence", () => {
  it("creates a completion with today's CompletedDate and the chore's current Stars", () => {
    const chore = baseChore({ stars: 7 });
    const result = completeOccurrence({
      chore,
      profileId: "profile-1",
      occurrenceDate: "2026-01-01",
      today: "2026-01-01",
      existingCompletions: [],
      newId,
    });
    expect(result.alreadyCompleted).toBe(false);
    expect(result.completion.starsAwarded).toBe(7);
    expect(result.completion.completedDate).toBe("2026-01-01");
    expect(result.completion.occurrenceDate).toBe("2026-01-01");
  });

  it("a late completion keeps its original OccurrenceDate", () => {
    const chore = baseChore({});
    const result = completeOccurrence({
      chore,
      profileId: "profile-1",
      occurrenceDate: "2026-01-01",
      today: "2026-01-05",
      existingCompletions: [],
      newId,
    });
    expect(result.completion.occurrenceDate).toBe("2026-01-01");
    expect(result.completion.completedDate).toBe("2026-01-05");
  });

  it("is idempotent: completing an already-completed occurrence returns the existing completion", () => {
    const chore = baseChore({ stars: 7 });
    const existing: Completion = {
      id: "existing",
      key: "chore-1:2026-01-01",
      choreId: "chore-1",
      profileId: "profile-1",
      occurrenceDate: "2026-01-01",
      completedDate: "2026-01-01",
      starsAwarded: 7,
      dismissed: false,
    };
    const result = completeOccurrence({
      chore,
      profileId: "profile-1",
      occurrenceDate: "2026-01-01",
      today: "2026-01-01",
      existingCompletions: [existing],
      newId,
    });
    expect(result.alreadyCompleted).toBe(true);
    expect(result.completion).toBe(existing);
  });

  it("changing a chore's Stars affects only future completions (past ones are frozen)", () => {
    const original: Completion = {
      id: "past",
      key: "chore-1:2026-01-01",
      choreId: "chore-1",
      profileId: "profile-1",
      occurrenceDate: "2026-01-01",
      completedDate: "2026-01-01",
      starsAwarded: 5,
      dismissed: false,
    };
    const chore = baseChore({ stars: 50, startDate: "2026-01-02" });
    const result = completeOccurrence({
      chore,
      profileId: "profile-1",
      occurrenceDate: "2026-01-02",
      today: "2026-01-02",
      existingCompletions: [original],
      newId,
    });
    expect(original.starsAwarded).toBe(5);
    expect(result.completion.starsAwarded).toBe(50);
  });
});

describe("dismissOccurrence", () => {
  it("settles the occurrence for no stars and marks it dismissed", () => {
    const chore = baseChore({ stars: 7 });
    const result = dismissOccurrence({
      chore,
      profileId: "profile-1",
      occurrenceDate: "2026-01-01",
      today: "2026-01-03",
      existingCompletions: [],
      newId,
    });
    expect(result.alreadyCompleted).toBe(false);
    expect(result.completion.starsAwarded).toBe(0);
    expect(result.completion.dismissed).toBe(true);
    // The record is still for the day it was due, written on the day it was waved off.
    expect(result.completion.occurrenceDate).toBe("2026-01-01");
    expect(result.completion.completedDate).toBe("2026-01-03");
  });

  it("restarts an after_completion chore's clock instead of retiring it", () => {
    const chore = baseChore({
      repeatMode: "after_completion",
      delayDays: 3,
      startDate: "2026-01-01",
      nextDueDate: "2026-01-01",
    });
    const result = dismissOccurrence({
      chore,
      profileId: "profile-1",
      occurrenceDate: "2026-01-01",
      today: "2026-01-05",
      existingCompletions: [],
      newId,
    });
    expect(result.previousNextDueDate).toBe("2026-01-01");
    expect(result.nextNextDueDate).toBe("2026-01-08");
  });

  it("leaves an already-completed occurrence, and its stars, alone", () => {
    const chore = baseChore({ stars: 7 });
    const existing: Completion = {
      id: "existing",
      key: "chore-1:2026-01-01",
      choreId: "chore-1",
      profileId: "profile-1",
      occurrenceDate: "2026-01-01",
      completedDate: "2026-01-01",
      starsAwarded: 7,
      dismissed: false,
    };
    const result = dismissOccurrence({
      chore,
      profileId: "profile-1",
      occurrenceDate: "2026-01-01",
      today: "2026-01-02",
      existingCompletions: [existing],
      newId,
    });
    expect(result.alreadyCompleted).toBe(true);
    expect(result.completion).toBe(existing);
  });
});

describe("after_completion: DelayDays", () => {
  it("DelayDays of 0 makes the next occurrence due the same day it was completed", () => {
    const chore = baseChore({
      repeatMode: "after_completion",
      delayDays: 0,
      startDate: "2026-01-01",
      nextDueDate: "2026-01-01",
    });
    expect(nextDueDateAfterCompletion(chore, "2026-01-05")).toBe("2026-01-05");
  });

  it("DelayDays greater than 0 pushes the next occurrence out", () => {
    const chore = baseChore({
      repeatMode: "after_completion",
      delayDays: 3,
      startDate: "2026-01-01",
      nextDueDate: "2026-01-01",
    });
    expect(nextDueDateAfterCompletion(chore, "2026-01-05")).toBe("2026-01-08");
  });

  it("completing an after_completion chore returns the previous and next NextDueDate", () => {
    const chore = baseChore({
      repeatMode: "after_completion",
      delayDays: 3,
      startDate: "2026-01-01",
      nextDueDate: "2026-01-01",
    });
    const result = completeOccurrence({
      chore,
      profileId: "profile-1",
      occurrenceDate: "2026-01-01",
      today: "2026-01-01",
      existingCompletions: [],
      newId,
    });
    expect(result.previousNextDueDate).toBe("2026-01-01");
    expect(result.nextNextDueDate).toBe("2026-01-04");
  });
});

describe("canUndo", () => {
  it("allows undo only when CompletedDate is today", () => {
    const completion: Completion = {
      id: "c1",
      key: "chore-1:2026-01-01",
      choreId: "chore-1",
      profileId: "profile-1",
      occurrenceDate: "2026-01-01",
      completedDate: "2026-01-05",
      starsAwarded: 5,
      dismissed: false,
    };
    expect(canUndo(completion, "2026-01-05")).toBe(true);
    expect(canUndo(completion, "2026-01-06")).toBe(false);
  });
});
