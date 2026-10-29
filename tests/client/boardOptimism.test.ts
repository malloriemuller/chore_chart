import { describe, expect, it } from "vitest";
import {
  withOccurrenceDismissed,
  withOccurrenceDone,
  withOccurrencesUndone,
} from "../../lib/client/boardOptimism";
import type { Chore } from "../../lib/domain/types";
import type { BoardResponse } from "../../lib/server/board";

const TODAY = "2026-01-09";

function chore(overrides: Partial<Chore> = {}): Chore {
  return {
    id: "chore-1",
    title: "Brush teeth",
    assigneeId: "profile-1",
    stars: 3,
    timeOfDay: "anytime",
    repeatMode: "schedule",
    frequency: "daily",
    interval: 1,
    startDate: "2026-01-01",
    carryOver: true,
    archived: false,
    ...overrides,
  };
}

/** Yesterday is being carried forward, and today's own occurrence is still due. */
function board(): BoardResponse {
  return {
    today: TODAY,
    profiles: [],
    chores: [chore()],
    occurrences: [
      { choreId: "chore-1", occurrenceDate: "2026-01-08", status: "overdue" },
      { choreId: "chore-1", occurrenceDate: TODAY, status: "due" },
    ],
    completions: [],
    balances: { "profile-1": 10 },
  };
}

const args = (occurrenceDate: string) => ({
  choreId: "chore-1",
  occurrenceDate,
  profileId: "profile-1",
  stars: 0,
  completionId: "new-completion",
});

describe("withOccurrenceDismissed", () => {
  it("takes a carried-forward day off the board, since it stops being carried", () => {
    const next = withOccurrenceDismissed(board(), args("2026-01-08"));
    expect(next.occurrences).toEqual([{ choreId: "chore-1", occurrenceDate: TODAY, status: "due" }]);
  });

  it("greys today's own occurrence in place", () => {
    const next = withOccurrenceDismissed(board(), args(TODAY));
    expect(next.occurrences.find((o) => o.occurrenceDate === TODAY)?.status).toBe("dismissed");
  });

  it("records the skip for no stars and leaves the balance alone", () => {
    const next = withOccurrenceDismissed(board(), args(TODAY));
    expect(next.completions).toHaveLength(1);
    expect(next.completions[0]).toMatchObject({ starsAwarded: 0, dismissed: true });
    expect(next.balances["profile-1"]).toBe(10);
  });
});

describe("withOccurrencesUndone", () => {
  it("puts a dropped occurrence back at the status it had", () => {
    const dismissed = withOccurrenceDismissed(board(), args("2026-01-08"));
    const undone = withOccurrencesUndone(dismissed, [
      {
        choreId: "chore-1",
        occurrenceDate: "2026-01-08",
        profileId: "profile-1",
        stars: 0,
        priorStatus: "overdue",
      },
    ]);
    expect(undone.occurrences).toContainEqual({
      choreId: "chore-1",
      occurrenceDate: "2026-01-08",
      status: "overdue",
    });
    expect(undone.completions).toEqual([]);
    expect(undone.balances["profile-1"]).toBe(10);
  });

  it("takes back the stars from an undone check-off", () => {
    const done = withOccurrenceDone(board(), { ...args(TODAY), stars: 3 });
    expect(done.balances["profile-1"]).toBe(13);

    const undone = withOccurrencesUndone(done, [
      {
        choreId: "chore-1",
        occurrenceDate: TODAY,
        profileId: "profile-1",
        stars: 3,
        priorStatus: "due",
      },
    ]);
    expect(undone.balances["profile-1"]).toBe(10);
    expect(undone.occurrences.find((o) => o.occurrenceDate === TODAY)?.status).toBe("due");
    expect(undone.completions).toEqual([]);
  });
});
