import { describe, expect, it } from "vitest";
import { carriedForwardDates, statusForOccurrence } from "../../lib/domain/status";
import type { Chore, Completion } from "../../lib/domain/types";
import { carriedForwardOccurrencesForProfile, choreOccurrenceDates } from "../../lib/server/board";

// The viewed week runs Sun 2026-01-04 .. Sat 2026-01-10, seen on Fri 2026-01-09.
const WEEK_START = "2026-01-04";
const WEEK_END = "2026-01-10";
const TODAY = "2026-01-09";

function weekdayChore(overrides: Partial<Chore> = {}): Chore {
  return {
    id: "chore-1",
    title: "Brush teeth",
    assigneeId: "profile-1",
    stars: 1,
    timeOfDay: "anytime",
    repeatMode: "schedule",
    frequency: "daily",
    interval: 1,
    daysOfWeek: ["MO", "TU", "WE", "TH", "FR"],
    startDate: "2026-01-05",
    archived: false,
    ...overrides,
  };
}

function completedOn(date: string): Completion {
  return {
    id: `c-${date}`,
    key: `chore-1:${date}`,
    choreId: "chore-1",
    profileId: "profile-1",
    occurrenceDate: date,
    completedDate: date,
    starsAwarded: 1,
    dismissed: false,
  };
}

function dismissedOn(date: string): Completion {
  return { ...completedOn(date), starsAwarded: 0, dismissed: true };
}

/** Mirrors how getBoardData labels each date, without the Airtable round trip. */
function statuses(chore: Chore, completions: Completion[], overdueDate: string | null) {
  return choreOccurrenceDates(chore, completions, TODAY, WEEK_START, WEEK_END).map((date) => [
    date,
    statusForOccurrence(
      date,
      TODAY,
      completions.find((c) => c.key === `chore-1:${date}`),
      overdueDate !== null && date === overdueDate,
    ),
  ]);
}

describe("choreOccurrenceDates over a week", () => {
  it("keeps a skipped day visible as missed rather than dropping it", () => {
    // Tuesday the 6th was skipped; the rest of the week so far was done.
    const completions = ["2026-01-05", "2026-01-07", "2026-01-08"].map(completedOn);
    expect(statuses(weekdayChore(), completions, null)).toEqual([
      ["2026-01-05", "done"],
      ["2026-01-06", "missed"],
      ["2026-01-07", "done"],
      ["2026-01-08", "done"],
      ["2026-01-09", "due"],
    ]);
  });

  it("marks only the carried-over date overdue, leaving older misses as missed", () => {
    // Nothing done all week; with CarryOver on, Thursday the 8th is the most recent miss.
    expect(statuses(weekdayChore({ carryOver: true }), [], "2026-01-08")).toEqual([
      ["2026-01-05", "missed"],
      ["2026-01-06", "missed"],
      ["2026-01-07", "missed"],
      ["2026-01-08", "overdue"],
      ["2026-01-09", "due"],
    ]);
  });

  it("never produces an overdue date without CarryOver", () => {
    const result = statuses(weekdayChore(), [], null);
    expect(result.every(([, status]) => status !== "overdue")).toBe(true);
    expect(result.filter(([, status]) => status === "missed")).toHaveLength(4);
  });

  it("shows a skipped day as dismissed on its own day", () => {
    const completions = [dismissedOn("2026-01-06")];
    expect(statuses(weekdayChore(), completions, null)).toEqual([
      ["2026-01-05", "missed"],
      ["2026-01-06", "dismissed"],
      ["2026-01-07", "missed"],
      ["2026-01-08", "missed"],
      ["2026-01-09", "due"],
    ]);
  });

  it("stops carrying the chore forward once its whole backlog is skipped", () => {
    const chore = weekdayChore({ carryOver: true });
    // Skipping only the overdue row would promote Wednesday the 7th in its place, so every
    // carried-forward date is settled together.
    const skipped = carriedForwardDates(chore, [], TODAY).map(dismissedOn);
    expect(skipped.map((c) => c.occurrenceDate)).toEqual([
      "2026-01-05",
      "2026-01-06",
      "2026-01-07",
      "2026-01-08",
    ]);
    expect(carriedForwardDates(chore, skipped, TODAY)).toEqual([]);
    expect(statuses(chore, skipped, null)).toEqual([
      ["2026-01-05", "dismissed"],
      ["2026-01-06", "dismissed"],
      ["2026-01-07", "dismissed"],
      ["2026-01-08", "dismissed"],
      ["2026-01-09", "due"],
    ]);
  });

  it("excludes the weekend, which the chore never falls on", () => {
    const dates = choreOccurrenceDates(weekdayChore(), [], TODAY, WEEK_START, WEEK_END);
    expect(dates).not.toContain("2026-01-04"); // Sunday
    expect(dates).not.toContain("2026-01-10"); // Saturday
  });
});

describe("carriedForwardOccurrencesForProfile", () => {
  const carrying = weekdayChore({ carryOver: true });
  const oneOff = weekdayChore({
    id: "chore-2",
    title: "Tidy the shed",
    repeatMode: "none",
    startDate: "2026-01-02",
    frequency: undefined,
    daysOfWeek: undefined,
  });
  const otherKid = weekdayChore({ id: "chore-3", assigneeId: "profile-2", carryOver: true });

  it("gathers the whole pile for one profile, oldest date first per chore", () => {
    const result = carriedForwardOccurrencesForProfile(
      "profile-1",
      [carrying, oneOff, otherKid],
      [],
      TODAY,
    ).map(({ chore, occurrenceDate }) => [chore.id, occurrenceDate]);

    expect(result).toEqual([
      ["chore-1", "2026-01-05"],
      ["chore-1", "2026-01-06"],
      ["chore-1", "2026-01-07"],
      ["chore-1", "2026-01-08"],
      ["chore-2", "2026-01-02"],
    ]);
  });

  it("leaves out chores that aren't carrying anything forward", () => {
    // Without CarryOver a missed scheduled day is simply gone, so there is nothing to clear.
    const result = carriedForwardOccurrencesForProfile("profile-1", [weekdayChore()], [], TODAY);
    expect(result).toEqual([]);
  });

  it("skips a chore whose StartDate was hand-edited into something unparseable", () => {
    const broken = weekdayChore({ id: "chore-4", startDate: "whenever", carryOver: true });
    expect(carriedForwardOccurrencesForProfile("profile-1", [broken], [], TODAY)).toEqual([]);
  });
});
