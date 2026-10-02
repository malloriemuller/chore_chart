import type { Completion } from "../../domain/types";
import { createRecords, deleteRecords, getRecord, listAllRecords } from "../client";
import { escapeFormulaString } from "../formula";
import { completionToDomain, completionToFields, type CompletionFields } from "../mappers";

const TABLE = "Completions";

/** Unbounded, uncached: used sparingly, e.g. once per board request to compute balances. */
export async function listAllCompletions(): Promise<Completion[]> {
  const records = await listAllRecords<CompletionFields>(TABLE);
  return records.map(completionToDomain);
}

export async function getCompletionById(id: string): Promise<Completion> {
  const record = await getRecord<CompletionFields>(TABLE, id);
  return completionToDomain(record);
}

export async function listCompletionsInRange(startDate: string, endDate: string): Promise<Completion[]> {
  const formula = `AND({OccurrenceDate} >= "${escapeFormulaString(startDate)}", {OccurrenceDate} <= "${escapeFormulaString(endDate)}")`;
  const records = await listAllRecords<CompletionFields>(TABLE, { filterByFormula: formula });
  return records.map(completionToDomain);
}

/** Linked-record fields can't be filtered server-side reliably, so this filters client-side. */
export async function listCompletionsForProfile(profileId: string): Promise<Completion[]> {
  const records = await listAllRecords<CompletionFields>(TABLE);
  return records.map(completionToDomain).filter((c) => c.profileId === profileId);
}

export async function findCompletionByKey(key: string): Promise<Completion | undefined> {
  const formula = `{Key} = "${escapeFormulaString(key)}"`;
  const records = await listAllRecords<CompletionFields>(TABLE, { filterByFormula: formula });
  return records.map(completionToDomain)[0];
}

export async function createCompletion(input: Omit<Completion, "id">): Promise<Completion> {
  const [record] = await createRecords<CompletionFields>(TABLE, [
    { fields: completionToFields(input) as CompletionFields },
  ]);
  return completionToDomain(record);
}

export async function deleteCompletion(id: string): Promise<void> {
  await deleteRecords(TABLE, [id]);
}
