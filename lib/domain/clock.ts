import { toZonedTime } from "date-fns-tz";
import { formatLocalDate } from "./dates";

/** The household's current wall-clock date, derived from a real instant and timezone. */
export function getHouseholdToday(timeZone: string, now: Date = new Date()): string {
  const zoned = toZonedTime(now, timeZone);
  return formatLocalDate(zoned);
}
