import type { Bonus, Completion, Redemption } from "./types";

/** Everything that moves a child's star balance. Passed whole so no source is accidentally left out. */
export interface StarLedger {
  completions: Completion[];
  redemptions: Redemption[];
  bonuses: Bonus[];
}

export function computeBalance(profileId: string, ledger: StarLedger): number {
  const mine = <T extends { profileId: string }>(rows: T[]) => rows.filter((r) => r.profileId === profileId);

  const earned = mine(ledger.completions).reduce((sum, c) => sum + c.starsAwarded, 0);
  // Bonuses can be negative, which is how stars are taken back or a mistake is corrected.
  const given = mine(ledger.bonuses).reduce((sum, b) => sum + b.stars, 0);
  const spent = mine(ledger.redemptions).reduce((sum, r) => sum + r.cost, 0);

  return earned + given - spent;
}

export function canRedeem(profileId: string, cost: number, ledger: StarLedger): boolean {
  return computeBalance(profileId, ledger) >= cost;
}
