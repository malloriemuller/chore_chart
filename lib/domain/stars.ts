import type { Completion, Redemption } from "./types";

export function computeBalance(
  profileId: string,
  completions: Completion[],
  redemptions: Redemption[],
): number {
  const earned = completions
    .filter((c) => c.profileId === profileId)
    .reduce((sum, c) => sum + c.starsAwarded, 0);
  const spent = redemptions
    .filter((r) => r.profileId === profileId)
    .reduce((sum, r) => sum + r.cost, 0);
  return earned - spent;
}

export function canRedeem(
  profileId: string,
  cost: number,
  completions: Completion[],
  redemptions: Redemption[],
): boolean {
  return computeBalance(profileId, completions, redemptions) >= cost;
}
