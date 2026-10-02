import { describe, expect, it } from "vitest";
import { canRedeem, computeBalance } from "../../lib/domain/stars";
import type { Completion, Redemption } from "../../lib/domain/types";

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

function redemption(overrides: Partial<Redemption>): Redemption {
  return {
    id: "r1",
    label: "Movie night – Kid",
    rewardId: "reward-1",
    profileId: "profile-1",
    cost: 1,
    redeemedDate: "2026-01-01",
    ...overrides,
  };
}

describe("computeBalance", () => {
  it("is the sum of StarsAwarded minus the sum of redemption Cost", () => {
    const completions = [
      completion({ id: "c1", starsAwarded: 5 }),
      completion({ id: "c2", starsAwarded: 3 }),
      completion({ id: "c3", profileId: "profile-2", starsAwarded: 100 }),
    ];
    const redemptions = [redemption({ id: "r1", cost: 2 })];
    expect(computeBalance("profile-1", completions, redemptions)).toBe(6);
  });

  it("stays correct after completing, undoing (removing), and redeeming", () => {
    let completions: Completion[] = [];
    const redemptions: Redemption[] = [];

    completions.push(completion({ id: "c1", starsAwarded: 5 }));
    expect(computeBalance("profile-1", completions, redemptions)).toBe(5);

    completions.push(completion({ id: "c2", starsAwarded: 5, key: "chore-2:2026-01-01" }));
    expect(computeBalance("profile-1", completions, redemptions)).toBe(10);

    // Undo removes the completion entirely.
    completions = completions.filter((c) => c.id !== "c2");
    expect(computeBalance("profile-1", completions, redemptions)).toBe(5);

    redemptions.push(redemption({ id: "r1", cost: 3 }));
    expect(computeBalance("profile-1", completions, redemptions)).toBe(2);
  });
});

describe("canRedeem", () => {
  it("is allowed only when the balance covers the cost", () => {
    const completions = [completion({ starsAwarded: 10 })];
    expect(canRedeem("profile-1", 10, completions, [])).toBe(true);
    expect(canRedeem("profile-1", 11, completions, [])).toBe(false);
  });
});
