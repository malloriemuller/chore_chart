export interface AirtableRecord<TFields = Record<string, unknown>> {
  id: string;
  createdTime?: string;
  fields: TFields;
}

export interface AirtableListResponse<TFields = Record<string, unknown>> {
  records: AirtableRecord<TFields>[];
  offset?: string;
}

export interface ListParams {
  filterByFormula?: string;
  sort?: { field: string; direction?: "asc" | "desc" }[];
  fields?: string[];
  pageSize?: number;
}
