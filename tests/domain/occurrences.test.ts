import { describe, expect, it } from "vitest";
import { generateOccurrences, getNextOccurrences } from "../../lib/domain/occurrences";
import type { Chore } from "../../lib/domain/types";

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

describe("generateOccurrences: none", () => {
  it("has a single occurrence on StartDate", () => {
    const chore = baseChore({ repeatMode: "none", startDate: "2026-03-10" });
    expect(generateOccurrences(chore, "2026-03-01", "2026-03-31")).toEqual(["2026-03-10"]);
  });

  it("is empty when StartDate falls outside the range", () => {
    const chore = baseChore({ repeatMode: "none", startDate: "2026-03-10" });
    expect(generateOccurrences(chore, "2026-04-01", "2026-04-30")).toEqual([]);
  });
});

describe("generateOccurrences: schedule daily", () => {
  it("every Interval days from StartDate", () => {
    const chore = baseChore({
      repeatMode: "schedule",
      frequency: "daily",
      interval: 3,
      startDate: "2026-01-01",
    });
    expect(generateOccurrences(chore, "2026-01-01", "2026-01-10")).toEqual([
      "2026-01-01",
      "2026-01-04",
      "2026-01-07",
      "2026-01-10",
    ]);
  });

  it("aligns to StartDate even when the range starts mid-cycle", () => {
    const chore = baseChore({
      repeatMode: "schedule",
      frequency: "daily",
      interval: 3,
      startDate: "2026-01-01",
    });
    // Jan 1 + 3*k: 1,4,7,10,13... so within [5,12] only 7 and 10 qualify.
    expect(generateOccurrences(chore, "2026-01-05", "2026-01-12")).toEqual(["2026-01-07", "2026-01-10"]);
  });

  it("a missed occurrence never delays the next one", () => {
    const chore = baseChore({
      repeatMode: "schedule",
      frequency: "daily",
      interval: 2,
      startDate: "2026-01-01",
    });
    // Occurrences land on 1,3,5,7,9 regardless of whether 3 or 5 were ever completed.
    expect(generateOccurrences(chore, "2026-01-01", "2026-01-09")).toEqual([
      "2026-01-01",
      "2026-01-03",
      "2026-01-05",
      "2026-01-07",
      "2026-01-09",
    ]);
  });
});

describe("generateOccurrences: schedule daily with DaysOfWeek", () => {
  it("only lands on the selected weekdays", () => {
    const chore = baseChore({
      repeatMode: "schedule",
      frequency: "daily",
      interval: 1,
      startDate: "2026-01-01", // a Thursday
      daysOfWeek: ["MO", "TU", "WE", "TH", "FR"],
    });
    expect(generateOccurrences(chore, "2026-01-01", "2026-01-11")).toEqual([
      "2026-01-01", // Thu
      "2026-01-02", // Fri
      // 01-03 Sat and 01-04 Sun skipped
      "2026-01-05", // Mon
      "2026-01-06", // Tue
      "2026-01-07", // Wed
      "2026-01-08", // Thu
      "2026-01-09", // Fri
      // 01-10 Sat and 01-11 Sun skipped
    ]);
  });

  it("repeats every day when DaysOfWeek is empty", () => {
    const chore = baseChore({
      repeatMode: "schedule",
      frequency: "daily",
      interval: 1,
      startDate: "2026-01-01",
      daysOfWeek: [],
    });
    expect(generateOccurrences(chore, "2026-01-01", "2026-01-04")).toEqual([
      "2026-01-01",
      "2026-01-02",
      "2026-01-03",
      "2026-01-04",
    ]);
  });

  it("applies Interval and the weekday filter together", () => {
    const chore = baseChore({
      repeatMode: "schedule",
      frequency: "daily",
      interval: 2, // every other day from Thu 01-01
      startDate: "2026-01-01",
      daysOfWeek: ["MO", "TU", "WE", "TH", "FR"],
    });
    // Every-other-day hits 01, 03, 05, 07, 09, 11; weekends (03, 11) drop out.
    expect(generateOccurrences(chore, "2026-01-01", "2026-01-11")).toEqual([
      "2026-01-01", // Thu
      "2026-01-05", // Mon
      "2026-01-07", // Wed
      "2026-01-09", // Fri
    ]);
  });
});

describe("generateOccurrences: schedule weekly", () => {
  it("every week on each selected day", () => {
    const chore = baseChore({
      repeatMode: "schedule",
      frequency: "weekly",
      interval: 1,
      startDate: "2026-01-04", // a Sunday
      daysOfWeek: ["MO", "TH"],
    });
    expect(generateOccurrences(chore, "2026-01-04", "2026-01-17")).toEqual([
      "2026-01-05", // Mon
      "2026-01-08", // Thu
      "2026-01-12", // Mon
      "2026-01-15", // Thu
    ]);
  });

  it("falls back to the StartDate weekday when DaysOfWeek is empty", () => {
    const chore = baseChore({
      repeatMode: "schedule",
      frequency: "weekly",
      interval: 1,
      startDate: "2026-01-07", // a Wednesday
      daysOfWeek: [],
    });
    expect(generateOccurrences(chore, "2026-01-01", "2026-01-21")).toEqual([
      "2026-01-07",
      "2026-01-14",
      "2026-01-21",
    ]);
  });

  it("multi-week intervals count weeks from the week containing StartDate", () => {
    const chore = baseChore({
      repeatMode: "schedule",
      frequency: "weekly",
      interval: 2,
      startDate: "2026-01-05", // Monday, week of Jan 4 (Sun)
      daysOfWeek: ["MO", "TH"],
    });
    // Week 0 (Jan 4-10): qualifies. Week 1 (Jan 11-17): skipped. Week 2 (Jan 18-24): qualifies.
    expect(generateOccurrences(chore, "2026-01-01", "2026-01-24")).toEqual([
      "2026-01-05",
      "2026-01-08",
      "2026-01-19",
      "2026-01-22",
    ]);
  });

  it("does not generate days before StartDate within the start week", () => {
    const chore = baseChore({
      repeatMode: "schedule",
      frequency: "weekly",
      interval: 1,
      startDate: "2026-01-07", // Wednesday
      daysOfWeek: ["SU", "WE"],
    });
    // The Sunday of the start week (Jan 4) is before StartDate and must be excluded.
    expect(generateOccurrences(chore, "2026-01-01", "2026-01-14")).toEqual([
      "2026-01-07",
      "2026-01-11",
      "2026-01-14",
    ]);
  });
});

describe("generateOccurrences: schedule monthly", () => {
  it("every Interval months on the day-of-month of StartDate", () => {
    const chore = baseChore({
      repeatMode: "schedule",
      frequency: "monthly",
      interval: 1,
      startDate: "2026-01-15",
    });
    expect(generateOccurrences(chore, "2026-01-01", "2026-04-30")).toEqual([
      "2026-01-15",
      "2026-02-15",
      "2026-03-15",
      "2026-04-15",
    ]);
  });

  it("clamps to the last day of the month when the day doesn't exist", () => {
    const chore = baseChore({
      repeatMode: "schedule",
      frequency: "monthly",
      interval: 1,
      startDate: "2026-01-31",
    });
    // Feb 2026 has 28 days, Apr has 30.
    expect(generateOccurrences(chore, "2026-01-01", "2026-04-30")).toEqual([
      "2026-01-31",
      "2026-02-28",
      "2026-03-31",
      "2026-04-30",
    ]);
  });

  it("supports multi-month intervals", () => {
    const chore = baseChore({
      repeatMode: "schedule",
      frequency: "monthly",
      interval: 3,
      startDate: "2026-01-31",
    });
    expect(generateOccurrences(chore, "2026-01-01", "2026-12-31")).toEqual([
      "2026-01-31",
      "2026-04-30",
      "2026-07-31",
      "2026-10-31",
    ]);
  });
});

describe("generateOccurrences: EndDate handling", () => {
  it("stops generating after EndDate (inclusive)", () => {
    const chore = baseChore({
      repeatMode: "schedule",
      frequency: "daily",
      interval: 1,
      startDate: "2026-01-01",
      endDate: "2026-01-05",
    });
    expect(generateOccurrences(chore, "2026-01-01", "2026-01-31")).toEqual([
      "2026-01-01",
      "2026-01-02",
      "2026-01-03",
      "2026-01-04",
      "2026-01-05",
    ]);
  });

  it("is open-ended when EndDate is absent", () => {
    const chore = baseChore({
      repeatMode: "schedule",
      frequency: "monthly",
      interval: 6,
      startDate: "2026-01-01",
    });
    expect(generateOccurrences(chore, "2026-01-01", "2027-01-01")).toEqual([
      "2026-01-01",
      "2026-07-01",
      "2027-01-01",
    ]);
  });
});

describe("generateOccurrences: after_completion", () => {
  it("has a single live occurrence on NextDueDate", () => {
    const chore = baseChore({
      repeatMode: "after_completion",
      delayDays: 3,
      startDate: "2026-01-01",
      nextDueDate: "2026-01-10",
    });
    expect(generateOccurrences(chore, "2026-01-01", "2026-01-31")).toEqual(["2026-01-10"]);
  });

  it("uses StartDate as NextDueDate on creation", () => {
    const chore = baseChore({
      repeatMode: "after_completion",
      delayDays: 3,
      startDate: "2026-01-01",
    });
    expect(generateOccurrences(chore, "2026-01-01", "2026-01-31")).toEqual(["2026-01-01"]);
  });
});

describe("generateOccurrences: DST transitions (America/Denver, 2026)", () => {
  it("daily interval counts correctly across the spring-forward night (Mar 8)", () => {
    const chore = baseChore({
      repeatMode: "schedule",
      frequency: "daily",
      interval: 2,
      startDate: "2026-03-06",
    });
    expect(generateOccurrences(chore, "2026-03-06", "2026-03-12")).toEqual([
      "2026-03-06",
      "2026-03-08",
      "2026-03-10",
      "2026-03-12",
    ]);
  });

  it("weekly occurrence still lands correctly across the fall-back night (Nov 1)", () => {
    const chore = baseChore({
      repeatMode: "schedule",
      frequency: "weekly",
      interval: 1,
      startDate: "2026-10-25", // Sunday
      daysOfWeek: ["SU"],
    });
    expect(generateOccurrences(chore, "2026-10-25", "2026-11-08")).toEqual([
      "2026-10-25",
      "2026-11-01",
      "2026-11-08",
    ]);
  });

  it("monthly occurrence on the 31st still clamps correctly in a DST-change month", () => {
    const chore = baseChore({
      repeatMode: "schedule",
      frequency: "monthly",
      interval: 1,
      startDate: "2026-01-31",
    });
    // March and November 2026 both have 31 days and both contain a DST transition.
    expect(generateOccurrences(chore, "2026-01-01", "2026-11-30")).toEqual([
      "2026-01-31",
      "2026-02-28",
      "2026-03-31",
      "2026-04-30",
      "2026-05-31",
      "2026-06-30",
      "2026-07-31",
      "2026-08-31",
      "2026-09-30",
      "2026-10-31",
      "2026-11-30",
    ]);
  });
});

describe("getNextOccurrences", () => {
  it("returns the next N due dates for a schedule chore spanning 3 months", () => {
    const chore = baseChore({
      repeatMode: "schedule",
      frequency: "weekly",
      interval: 2,
      startDate: "2026-01-05",
      daysOfWeek: ["MO", "TH"],
    });
    const next = getNextOccurrences(chore, "2026-01-05", 5);
    expect(next).toEqual(["2026-01-05", "2026-01-08", "2026-01-19", "2026-01-22", "2026-02-02"]);
  });

  it("returns a single date for a none chore", () => {
    const chore = baseChore({ repeatMode: "none", startDate: "2026-03-10" });
    expect(getNextOccurrences(chore, "2026-01-01", 5)).toEqual(["2026-03-10"]);
  });

  it("stops at EndDate even if fewer than N occurrences remain", () => {
    const chore = baseChore({
      repeatMode: "schedule",
      frequency: "monthly",
      interval: 1,
      startDate: "2026-01-31",
      endDate: "2026-03-31",
    });
    expect(getNextOccurrences(chore, "2026-01-01", 10)).toEqual(["2026-01-31", "2026-02-28", "2026-03-31"]);
  });
});
