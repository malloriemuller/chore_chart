export function getHouseholdTz(): string {
  const tz = process.env.HOUSEHOLD_TZ;
  if (!tz) throw new Error("Missing HOUSEHOLD_TZ environment variable");
  return tz;
}
