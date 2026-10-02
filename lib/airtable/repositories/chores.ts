import type { Chore } from "../../domain/types";
import { cached, invalidate } from "../cache";
import { createRecords, deleteRecords, listAllRecords, updateRecords } from "../client";
import { choreToDomain, choreToFields, type ChoreFields } from "../mappers";

const TABLE = "Chores";

async function all(): Promise<Chore[]> {
  return cached(TABLE, async () => {
    const records = await listAllRecords<ChoreFields>(TABLE);
    return records.map(choreToDomain);
  });
}

export async function listAllChores(): Promise<Chore[]> {
  return all();
}

export async function listActiveChores(): Promise<Chore[]> {
  return (await all()).filter((c) => !c.archived);
}

export async function getChore(id: string): Promise<Chore | undefined> {
  return (await all()).find((c) => c.id === id);
}

export async function createChore(input: Omit<Chore, "id">): Promise<Chore> {
  const [record] = await createRecords<ChoreFields>(TABLE, [{ fields: choreToFields(input) as ChoreFields }]);
  invalidate(TABLE);
  return choreToDomain(record);
}

export async function updateChore(id: string, patch: Partial<Chore>): Promise<Chore> {
  const [record] = await updateRecords<ChoreFields>(TABLE, [{ id, fields: choreToFields(patch) }]);
  invalidate(TABLE);
  return choreToDomain(record);
}

export async function archiveChore(id: string): Promise<Chore> {
  return updateChore(id, { archived: true });
}

/**
 * Removes the chore template for good. Past Completions are deliberately left alone: their
 * StarsAwarded is what a balance is built from, so deleting them would claw back stars a kid
 * already earned. An orphaned Completion degrades to the title "Chore" in the stars ledger.
 */
export async function deleteChore(id: string): Promise<void> {
  await deleteRecords(TABLE, [id]);
  invalidate(TABLE);
}
