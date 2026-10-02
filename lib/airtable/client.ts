import { getAirtableConfig } from "./config";
import { airtableLimiter } from "./limiter";
import type { AirtableListResponse, AirtableRecord, ListParams } from "./types";

const API_ROOT = "https://api.airtable.com/v0";
const MAX_ATTEMPTS = 4;
const BATCH_SIZE = 10;

class AirtableError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "AirtableError";
  }
}

async function requestWithRetry(path: string, init: RequestInit): Promise<Response> {
  const { pat } = getAirtableConfig();
  let attempt = 0;
  for (;;) {
    attempt += 1;
    const response = await airtableLimiter.run(() =>
      fetch(`${API_ROOT}${path}`, {
        ...init,
        headers: {
          Authorization: `Bearer ${pat}`,
          "Content-Type": "application/json",
          ...init.headers,
        },
      }),
    );

    const shouldRetry = (response.status === 429 || response.status >= 500) && attempt < MAX_ATTEMPTS;
    if (shouldRetry) {
      const backoffMs = 2 ** (attempt - 1) * 250;
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
      continue;
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new AirtableError(`Airtable request failed (${response.status}): ${body}`, response.status);
    }

    return response;
  }
}

function tablePath(baseId: string, table: string): string {
  return `/${baseId}/${encodeURIComponent(table)}`;
}

export async function listAllRecords<TFields = Record<string, unknown>>(
  table: string,
  params: ListParams = {},
): Promise<AirtableRecord<TFields>[]> {
  const { baseId } = getAirtableConfig();
  const records: AirtableRecord<TFields>[] = [];
  let offset: string | undefined;

  do {
    const query = new URLSearchParams();
    if (params.filterByFormula) query.set("filterByFormula", params.filterByFormula);
    if (params.pageSize) query.set("pageSize", String(params.pageSize));
    if (params.fields) {
      for (const field of params.fields) query.append("fields[]", field);
    }
    if (params.sort) {
      params.sort.forEach((s, i) => {
        query.set(`sort[${i}][field]`, s.field);
        query.set(`sort[${i}][direction]`, s.direction ?? "asc");
      });
    }
    if (offset) query.set("offset", offset);

    const response = await requestWithRetry(`${tablePath(baseId, table)}?${query.toString()}`, {
      method: "GET",
    });
    const data = (await response.json()) as AirtableListResponse<TFields>;
    records.push(...data.records);
    offset = data.offset;
  } while (offset);

  return records;
}

export async function getRecord<TFields = Record<string, unknown>>(
  table: string,
  id: string,
): Promise<AirtableRecord<TFields>> {
  const { baseId } = getAirtableConfig();
  const response = await requestWithRetry(`${tablePath(baseId, table)}/${id}`, { method: "GET" });
  return (await response.json()) as AirtableRecord<TFields>;
}

async function batched<TFields>(
  table: string,
  method: "PATCH" | "POST",
  items: { id?: string; fields: Partial<TFields> }[],
): Promise<AirtableRecord<TFields>[]> {
  const { baseId } = getAirtableConfig();
  const results: AirtableRecord<TFields>[] = [];

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const chunk = items.slice(i, i + BATCH_SIZE);
    const response = await requestWithRetry(tablePath(baseId, table), {
      method,
      body: JSON.stringify({ records: chunk }),
    });
    const data = (await response.json()) as { records: AirtableRecord<TFields>[] };
    results.push(...data.records);
  }

  return results;
}

export function createRecords<TFields>(
  table: string,
  records: { fields: Partial<TFields> }[],
): Promise<AirtableRecord<TFields>[]> {
  return batched(table, "POST", records);
}

export function updateRecords<TFields>(
  table: string,
  records: { id: string; fields: Partial<TFields> }[],
): Promise<AirtableRecord<TFields>[]> {
  return batched(table, "PATCH", records);
}

export async function deleteRecords(table: string, ids: string[]): Promise<void> {
  const { baseId } = getAirtableConfig();
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const chunk = ids.slice(i, i + BATCH_SIZE);
    const query = new URLSearchParams();
    for (const id of chunk) query.append("records[]", id);
    await requestWithRetry(`${tablePath(baseId, table)}?${query.toString()}`, { method: "DELETE" });
  }
}

export { AirtableError };
