import type { Redemption } from "../../domain/types";
import { createRecords, listAllRecords } from "../client";
import { redemptionToDomain, redemptionToFields, type RedemptionFields } from "../mappers";

const TABLE = "Redemptions";

/** Unbounded, uncached: used sparingly, e.g. once per board request to compute balances. */
export async function listAllRedemptions(): Promise<Redemption[]> {
  const records = await listAllRecords<RedemptionFields>(TABLE);
  return records.map(redemptionToDomain);
}

export async function listRecentRedemptions(limit = 10): Promise<Redemption[]> {
  const records = await listAllRecords<RedemptionFields>(TABLE, {
    sort: [{ field: "RedeemedDate", direction: "desc" }],
  });
  return records.map(redemptionToDomain).slice(0, limit);
}

/** Linked-record fields can't be filtered server-side reliably, so this filters client-side. */
export async function listRedemptionsForProfile(profileId: string): Promise<Redemption[]> {
  const records = await listAllRecords<RedemptionFields>(TABLE);
  return records.map(redemptionToDomain).filter((r) => r.profileId === profileId);
}

export async function createRedemption(input: Omit<Redemption, "id">): Promise<Redemption> {
  const [record] = await createRecords<RedemptionFields>(TABLE, [
    { fields: redemptionToFields(input) as RedemptionFields },
  ]);
  return redemptionToDomain(record);
}
