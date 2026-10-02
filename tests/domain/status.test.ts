import { describe, expect, it } from "vitest";
import { getOverdueOccurrenceDate, statusForOccurrence } from "../../lib/domain/status";
import type { Chore, Completion } from "../../lib/domain/types";

function baseChore(overrides: Partial<Chore>): Chore {
  return {
    id: "chore-1",
    title: "Test chore",
    assigneeId: "profile-1",
    stars: 1,
    timeOfDay: "anytime",
    repeatMode: "none",
    startDate: "2026-01-01",
    archived: false,
    ...overrides,
  };
}

function completion(overrides: Partial<Completion>): Completion {
  return {
    id: "c1",
    key: "chore-1:2026-01-01",
    choreId: "chore-1",
    profileId: "profile-1",
    occurrenceDate: "2026-01-01",
    completedDate: "2026-01-01",
    starsAwarded: 1,
    ...overrides,
  };
}

describe("statusForOccurrence", () => {
  it("is done when completed, regardless of date", () => {
    expect(statusForOccurrence("2026-01-01", "2026-06-01", true)).toBe("done");
  });
  it("is due when the occurrence date is today", () => {
    expect(statusForOccurrence("2026-06-01", "2026-06-01", false)).toBe("due");
  });
  it("is upcoming when the occurrence date is after today", () => {
    expect(statusForOccurrence("2026-06-02", "2026-06-01", false)).toBe("upcoming");
  });
  it("is overdue when the occurrence date is before today and incomplete", () => {
    expect(statusForOccurrence("2026-05-31", "2026-06-01", false)).toBe("overdue");
  });
});

describe("getOverdueOccurrenceDate: schedule", () => {
  const chore = baseChore({
    repeatMode: "schedule",
    frequency: "daily",
    interval: 1,
    startDate: "2026-01-01",
  });

  it("only looks back 7 days", () => {
    // today = 2026-02-01; the 7-day window is Jan 25 - Jan 31.
    const result = getOverdueOccurrenceDate(chore, [], "2026-02-01");
    expect(result).toBe("2026-01-31");
  });

  it("keeps only the most recent missed occurrence", () => {
    const completions = [completion({ key: "chore-1:2026-01-31", occurrenceDate: "2026-01-31" })];
    const result = getOverdueOccurrenceDate(chore, completions, "2026-02-01");
    expect(result).toBe("2026-01-30");
  });

  it("drops older misses silently once they fall outside the window", () => {
    // today = 2026-01-10; occurrences before Jan 3 are outside the 7-day lookback.
    const result = getOverdueOccurrenceDate(chore, [], "2026-01-10");
    expect(result).toBe("2026-01-09");
  });

  it("is null once everything in the window is completed", () => {
    const completions = ["2026-01-25", "2026-01-26", "2026-01-27", "2026-01-28", "2026-01-29", "2026-01-30", "2026-01-31"].map((d) =>
      completion({ key: `chore-1:${d}`, occurrenceDate: d }),
    );
    const result = getOverdueOccurrenceDate(chore, completions, "2026-02-01");
    expect(result).toBeNull();
  });
});

describe("getOverdueOccurrenceDate: none and after_completion persist indefinitely", () => {
  it("'none' stays overdue until completed, beyond 7 days", () => {
    const chore = baseChore({ repeatMode: "none", startDate: "2026-01-01" });
    const result = getOverdueOccurrenceDate(chore, [], "2026-06-01");
    expect(result).toBe("2026-01-01");
  });

  it("'after_completion' stays overdue until completed, beyond 7 days", () => {
    const chore = baseChore({
      repeatMode: "after_completion",
      startDate: "2026-01-01",
      nextDueDate: "2026-01-01",
      delayDays: 2,
    });
    const result = getOverdueOccurrenceDate(chore, [], "2026-06-01");
    expect(result).toBe("2026-01-01");
  });

  it("is null once that single occurrence is completed", () => {
    const chore = baseChore({ repeatMode: "none", startDate: "2026-01-01" });
    const completions = [completion({ key: "chore-1:2026-01-01", occurrenceDate: "2026-01-01" })];
    expect(getOverdueOccurrenceDate(chore, completions, "2026-06-01")).toBeNull();
  });
});

describe("late completion keeps its original OccurrenceDate", () => {
  it("a completion made late still reflects the due date it was for", () => {
    const late = completion({
      occurrenceDate: "2026-01-01",
      completedDate: "2026-01-05",
    });
    expect(late.occurrenceDate).toBe("2026-01-01");
    expect(late.completedDate).toBe("2026-01-05");
    // Once completed, status is "done" no matter how late.
    expect(statusForOccurrence(late.occurrenceDate, "2026-01-05", true)).toBe("done");
  });
});
