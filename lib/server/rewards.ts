import { listAllBonuses } from "../airtable/repositories/bonuses";
import { listAllCompletions } from "../airtable/repositories/completions";
import { listActiveProfiles } from "../airtable/repositories/profiles";
import { listAllRedemptions } from "../airtable/repositories/redemptions";
import { listActiveRewards } from "../airtable/repositories/rewards";
import { computeBalance } from "../domain/stars";
import type { Profile, Redemption, Reward } from "../domain/types";

export interface RewardsResponse {
  children: Profile[];
  rewards: Reward[];
  balances: Record<string, number>;
  recentRedemptions: Redemption[];
}

const RECENT_REDEMPTIONS_LIMIT = 10;

export async function getRewardsData(): Promise<RewardsResponse> {
  const [profiles, rewards, completions, redemptions, bonuses] = await Promise.all([
    listActiveProfiles(),
    listActiveRewards(),
    listAllCompletions(),
    listAllRedemptions(),
    listAllBonuses(),
  ]);

  const children = profiles.filter((p) => p.role === "child");

  const balances: Record<string, number> = {};
  for (const child of children) {
    balances[child.id] = computeBalance(child.id, { completions, redemptions, bonuses });
  }

  const recentRedemptions = [...redemptions]
    .sort((a, b) => b.redeemedDate.localeCompare(a.redeemedDate))
    .slice(0, RECENT_REDEMPTIONS_LIMIT);

  return { children, rewards, balances, recentRedemptions };
}
