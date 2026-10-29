import type { Bonus } from "../../domain/types";
import { createRecords, deleteRecords, listAllRecords } from "../client";
import { bonusToDomain, bonusToFields, type BonusFields } from "../mappers";

const TABLE = "Bonuses";

/** Unbounded, uncached: used sparingly, e.g. once per board request to compute balances. */
export async function listAllBonuses(): Promise<Bonus[]> {
  const records = await listAllRecords<BonusFields>(TABLE);
  return records.map(bonusToDomain);
}

/** Linked-record fields can't be filtered server-side reliably, so this filters client-side. */
export async function listBonusesForProfile(profileId: string): Promise<Bonus[]> {
  const records = await listAllRecords<BonusFields>(TABLE);
  return records.map(bonusToDomain).filter((b) => b.profileId === profileId);
}

export async function createBonus(input: Omit<Bonus, "id">): Promise<Bonus> {
  const [record] = await createRecords<BonusFields>(TABLE, [{ fields: bonusToFields(input) as BonusFields }]);
  return bonusToDomain(record);
}

export async function deleteBonus(id: string): Promise<void> {
  await deleteRecords(TABLE, [id]);
}
