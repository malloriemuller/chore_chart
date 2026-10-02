function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getAirtableConfig() {
  return {
    pat: requireEnv("AIRTABLE_PAT"),
    baseId: requireEnv("AIRTABLE_BASE_ID"),
  };
}
