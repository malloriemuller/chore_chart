/**
 * Reads the live Airtable base schema through the Metadata API and reports any
 * table or field that's missing or doesn't match what the app expects.
 *
 * Usage: npm run check:airtable
 */

for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {
    // Missing env file is fine; real env vars (e.g. from the shell or Vercel) still apply.
  }
}

interface ExpectedField {
  name: string;
  type: string;
  choices?: string[];
  integer?: boolean;
}

interface ExpectedTable {
  name: string;
  fields: ExpectedField[];
}

const SCHEMA: ExpectedTable[] = [
  {
    name: "Profiles",
    fields: [
      { name: "Name", type: "singleLineText" },
      { name: "Role", type: "singleSelect", choices: ["parent", "child"] },
      { name: "Color", type: "singleLineText" },
      { name: "Emoji", type: "singleLineText" },
      { name: "SortOrder", type: "number", integer: true },
      { name: "Active", type: "checkbox" },
    ],
  },
  {
    name: "Chores",
    fields: [
      { name: "Title", type: "singleLineText" },
      { name: "Emoji", type: "singleLineText" },
      { name: "Assignee", type: "multipleRecordLinks" },
      { name: "Stars", type: "number", integer: true },
      {
        name: "TimeOfDay",
        type: "singleSelect",
        choices: ["morning", "afternoon", "evening", "anytime"],
      },
      { name: "DueTime", type: "singleLineText" },
      {
        name: "RepeatMode",
        type: "singleSelect",
        choices: ["none", "schedule", "after_completion"],
      },
      { name: "StartDate", type: "singleLineText" },
      { name: "Frequency", type: "singleSelect", choices: ["daily", "weekly", "monthly"] },
      { name: "Interval", type: "number", integer: true },
      {
        name: "DaysOfWeek",
        type: "multipleSelects",
        choices: ["SU", "MO", "TU", "WE", "TH", "FR", "SA"],
      },
      { name: "EndDate", type: "singleLineText" },
      { name: "DelayDays", type: "number", integer: true },
      { name: "NextDueDate", type: "singleLineText" },
      { name: "CarryOver", type: "checkbox" },
      { name: "Archived", type: "checkbox" },
    ],
  },
  {
    name: "Completions",
    fields: [
      { name: "Key", type: "singleLineText" },
      { name: "Chore", type: "multipleRecordLinks" },
      { name: "Profile", type: "multipleRecordLinks" },
      { name: "OccurrenceDate", type: "singleLineText" },
      { name: "CompletedDate", type: "singleLineText" },
      { name: "StarsAwarded", type: "number", integer: true },
      { name: "Dismissed", type: "checkbox" },
    ],
  },
  {
    name: "Bonuses",
    fields: [
      { name: "Label", type: "singleLineText" },
      { name: "Profile", type: "multipleRecordLinks" },
      { name: "Stars", type: "number", integer: true },
      { name: "AwardedDate", type: "singleLineText" },
    ],
  },
  {
    name: "Rewards",
    fields: [
      { name: "Name", type: "singleLineText" },
      { name: "Emoji", type: "singleLineText" },
      { name: "Cost", type: "number", integer: true },
      { name: "Profile", type: "multipleRecordLinks" },
      { name: "Archived", type: "checkbox" },
    ],
  },
  {
    name: "Redemptions",
    fields: [
      { name: "Label", type: "singleLineText" },
      { name: "Reward", type: "multipleRecordLinks" },
      { name: "Profile", type: "multipleRecordLinks" },
      { name: "Cost", type: "number", integer: true },
      { name: "RedeemedDate", type: "singleLineText" },
    ],
  },
];

interface AirtableFieldSchema {
  name: string;
  type: string;
  options?: { precision?: number; choices?: { name: string }[] };
}

interface AirtableTableSchema {
  name: string;
  fields: AirtableFieldSchema[];
}

async function fetchBaseSchema(baseId: string, pat: string): Promise<AirtableTableSchema[]> {
  const response = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
    headers: { Authorization: `Bearer ${pat}` },
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Metadata API request failed (${response.status}): ${body}`);
  }
  const data = (await response.json()) as { tables: AirtableTableSchema[] };
  return data.tables;
}

function checkField(actual: AirtableFieldSchema | undefined, expected: ExpectedField): string[] {
  const problems: string[] = [];
  if (!actual) {
    problems.push(`missing field "${expected.name}"`);
    return problems;
  }
  if (actual.type !== expected.type) {
    problems.push(`field "${expected.name}" has type "${actual.type}", expected "${expected.type}"`);
  }
  if (expected.integer && actual.options?.precision !== 0) {
    problems.push(`field "${expected.name}" should be an integer (precision 0)`);
  }
  if (expected.choices) {
    const actualChoices = new Set((actual.options?.choices ?? []).map((c) => c.name));
    const missing = expected.choices.filter((c) => !actualChoices.has(c));
    if (missing.length > 0) {
      problems.push(`field "${expected.name}" is missing choice(s): ${missing.join(", ")}`);
    }
  }
  return problems;
}

async function main() {
  const pat = process.env.AIRTABLE_PAT;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!pat || !baseId) {
    console.error("Missing AIRTABLE_PAT or AIRTABLE_BASE_ID in the environment.");
    process.exit(1);
  }

  const tables = await fetchBaseSchema(baseId, pat);
  const tablesByName = new Map(tables.map((t) => [t.name, t]));

  let problemCount = 0;

  for (const expectedTable of SCHEMA) {
    const actualTable = tablesByName.get(expectedTable.name);
    if (!actualTable) {
      console.log(`✗ Table "${expectedTable.name}" is missing.`);
      problemCount += 1;
      continue;
    }

    const fieldsByName = new Map(actualTable.fields.map((f) => [f.name, f]));
    const tableProblems = expectedTable.fields.flatMap((f) => checkField(fieldsByName.get(f.name), f));

    if (tableProblems.length === 0) {
      console.log(`✓ Table "${expectedTable.name}" matches.`);
    } else {
      console.log(`✗ Table "${expectedTable.name}":`);
      for (const problem of tableProblems) {
        console.log(`  - ${problem}`);
      }
      problemCount += tableProblems.length;
    }
  }

  if (problemCount > 0) {
    console.log(`\n${problemCount} problem(s) found.`);
    process.exit(1);
  }
  console.log("\nAirtable base schema matches what the app expects.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
