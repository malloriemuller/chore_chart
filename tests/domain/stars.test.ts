import { describe, expect, it } from "vitest";
import { canRedeem, computeBalance } from "../../lib/domain/stars";
import type { Bonus, Completion, Redemption } from "../../lib/domain/types";

function completion(overrides: Partial<Completion>): Completion {
  return {
    id: "c1",
    key: "chore-1:2026-01-01",
    choreId: "chore-1",
    profileId: "profile-1",
    occurrenceDate: "2026-01-01",
    completedDate: "2026-01-01",
    starsAwarded: 1,
    dismissed: false,
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

function bonus(overrides: Partial<Bonus>): Bonus {
  return {
    id: "b1",
    label: "Nice to her brother",
    profileId: "profile-1",
    stars: 1,
    awardedDate: "2026-01-01",
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
    expect(computeBalance("profile-1", { completions, redemptions, bonuses: [] })).toBe(6);
  });

  it("stays correct after completing, undoing (removing), and redeeming", () => {
    let completions: Completion[] = [];
    const redemptions: Redemption[] = [];
    const bonuses: Bonus[] = [];

    completions.push(completion({ id: "c1", starsAwarded: 5 }));
    expect(computeBalance("profile-1", { completions, redemptions, bonuses })).toBe(5);

    completions.push(completion({ id: "c2", starsAwarded: 5, key: "chore-2:2026-01-01" }));
    expect(computeBalance("profile-1", { completions, redemptions, bonuses })).toBe(10);

    // Undo removes the completion entirely.
    completions = completions.filter((c) => c.id !== "c2");
    expect(computeBalance("profile-1", { completions, redemptions, bonuses })).toBe(5);

    redemptions.push(redemption({ id: "r1", cost: 3 }));
    expect(computeBalance("profile-1", { completions, redemptions, bonuses })).toBe(2);
  });

  it("counts bonus stars given outside the chore list", () => {
    const completions = [completion({ starsAwarded: 5 })];
    const bonuses = [bonus({ stars: 2 }), bonus({ id: "b2", stars: 1 })];
    expect(computeBalance("profile-1", { completions, redemptions: [], bonuses })).toBe(8);
  });

  it("subtracts a negative bonus, which is how stars are taken back", () => {
    const completions = [completion({ starsAwarded: 5 })];
    const bonuses = [bonus({ stars: -3, label: "Correcting a mistake" })];
    expect(computeBalance("profile-1", { completions, redemptions: [], bonuses })).toBe(2);
  });

  it("leaves another child's bonuses out of it", () => {
    const bonuses = [bonus({ stars: 5 }), bonus({ id: "b2", profileId: "profile-2", stars: 100 })];
    expect(computeBalance("profile-1", { completions: [], redemptions: [], bonuses })).toBe(5);
  });
});

describe("canRedeem", () => {
  it("is allowed only when the balance covers the cost", () => {
    const completions = [completion({ starsAwarded: 10 })];
    const ledger = { completions, redemptions: [], bonuses: [] };
    expect(canRedeem("profile-1", 10, ledger)).toBe(true);
    expect(canRedeem("profile-1", 11, ledger)).toBe(false);
  });

  it("counts bonus stars toward what can be redeemed", () => {
    const ledger = { completions: [], redemptions: [], bonuses: [bonus({ stars: 4 })] };
    expect(canRedeem("profile-1", 4, ledger)).toBe(true);
    expect(canRedeem("profile-1", 5, ledger)).toBe(false);
  });
});
