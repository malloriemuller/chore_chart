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
  const [completion] = await createCompletions([input]);
  return completion;
}

/** Batched by the client in chunks of 10, so a whole overdue pile goes up in one or two requests. */
export async function createCompletions(inputs: Omit<Completion, "id">[]): Promise<Completion[]> {
  if (inputs.length === 0) return [];
  const records = await createRecords<CompletionFields>(
    TABLE,
    inputs.map((input) => ({ fields: completionToFields(input) as CompletionFields })),
  );
  return records.map(completionToDomain);
}

export async function deleteCompletion(id: string): Promise<void> {
  await deleteRecords(TABLE, [id]);
}

export async function deleteCompletions(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await deleteRecords(TABLE, ids);
}
