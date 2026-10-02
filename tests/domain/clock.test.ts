import { describe, expect, it } from "vitest";
import { getHouseholdToday } from "../../lib/domain/clock";

describe("getHouseholdToday", () => {
  it("rolls over at local midnight, not UTC midnight", () => {
    // 2026-06-15 06:30 UTC is 2026-06-15 00:30 in America/Denver (UTC-6 in summer).
    const now = new Date("2026-06-15T06:30:00Z");
    expect(getHouseholdToday("America/Denver", now)).toBe("2026-06-15");
    // The same instant in UTC is still June 15 there, but one hour earlier would be June 14 in Denver.
    const earlier = new Date("2026-06-15T05:30:00Z");
    expect(getHouseholdToday("America/Denver", earlier)).toBe("2026-06-14");
  });

  it("is correct across the spring-forward transition (America/Denver, 2026-03-08)", () => {
    // 2026-03-08 09:30 UTC = 2026-03-08 02:30 MST (before the 2am->3am jump would apply the day before)
    // Use an instant safely after the transition: 09:30 UTC = 03:30 MDT.
    const afterTransition = new Date("2026-03-08T09:30:00Z");
    expect(getHouseholdToday("America/Denver", afterTransition)).toBe("2026-03-08");
    const justBeforeMidnightLocal = new Date("2026-03-08T06:59:00Z"); // 23:59 MST Mar 7
    expect(getHouseholdToday("America/Denver", justBeforeMidnightLocal)).toBe("2026-03-07");
  });

  it("is correct across the fall-back transition (America/Denver, 2026-11-01)", () => {
    const afterTransition = new Date("2026-11-01T08:30:00Z"); // 01:30 MST
    expect(getHouseholdToday("America/Denver", afterTransition)).toBe("2026-11-01");
    const justBeforeMidnightLocal = new Date("2026-11-01T05:59:00Z"); // 23:59 MDT Oct 31
    expect(getHouseholdToday("America/Denver", justBeforeMidnightLocal)).toBe("2026-10-31");
  });
});
