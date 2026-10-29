import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getChore } from "@/lib/airtable/repositories/chores";
import { listAllCompletions } from "@/lib/airtable/repositories/completions";
import { getHouseholdToday } from "@/lib/domain/clock";
import { carriedForwardDates } from "@/lib/domain/status";
import { dismissOccurrences } from "@/lib/server/dismissals";
import { getHouseholdTz } from "@/lib/server/env";

const bodySchema = z.object({
  choreId: z.string().min(1),
  profileId: z.string().min(1),
  occurrenceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/**
 * Waves one chore off: it stops being due or overdue and earns no stars. Skipping an overdue
 * occurrence settles the rest of that chore's backlog along with it — otherwise the day before it
 * would just take its place tomorrow.
 */
export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { choreId, profileId, occurrenceDate } = parsed.data;

  const [chore, completions] = await Promise.all([getChore(choreId), listAllCompletions()]);
  if (!chore || chore.archived) {
    return NextResponse.json({ error: "Chore not found." }, { status: 404 });
  }

  const today = getHouseholdToday(getHouseholdTz());
  const backlog = carriedForwardDates(chore, completions, today).filter((date) => date <= occurrenceDate);
  const dates = occurrenceDate < today ? [...new Set([...backlog, occurrenceDate])].sort() : [occurrenceDate];

  const dismissals = await dismissOccurrences(
    dates.map((date) => ({ chore, occurrenceDate: date })),
    profileId,
    today,
    completions,
  );

  return NextResponse.json({ dismissals });
}
