import type { Reward } from "../../domain/types";
import { cached, invalidate } from "../cache";
import { createRecords, listAllRecords, updateRecords } from "../client";
import { rewardToDomain, rewardToFields, type RewardFields } from "../mappers";

const TABLE = "Rewards";

async function all(): Promise<Reward[]> {
  return cached(TABLE, async () => {
    const records = await listAllRecords<RewardFields>(TABLE);
    return records.map(rewardToDomain);
  });
}

export async function listActiveRewards(): Promise<Reward[]> {
  return (await all()).filter((r) => !r.archived);
}

export async function listAllRewards(): Promise<Reward[]> {
  return all();
}

export async function getReward(id: string): Promise<Reward | undefined> {
  return (await all()).find((r) => r.id === id);
}

export async function createReward(input: Omit<Reward, "id">): Promise<Reward> {
  const [record] = await createRecords<RewardFields>(TABLE, [{ fields: rewardToFields(input) as RewardFields }]);
  invalidate(TABLE);
  return rewardToDomain(record);
}

export async function updateReward(id: string, patch: Partial<Reward>): Promise<Reward> {
  const [record] = await updateRecords<RewardFields>(TABLE, [{ id, fields: rewardToFields(patch) }]);
  invalidate(TABLE);
  return rewardToDomain(record);
}

export async function archiveReward(id: string): Promise<Reward> {
  return updateReward(id, { archived: true });
}
