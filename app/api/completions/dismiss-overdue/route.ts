import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { listActiveChores } from "@/lib/airtable/repositories/chores";
import { listAllCompletions } from "@/lib/airtable/repositories/completions";
import { getHouseholdToday } from "@/lib/domain/clock";
import { carriedForwardOccurrencesForProfile } from "@/lib/server/board";
import { dismissOccurrences } from "@/lib/server/dismissals";
import { getHouseholdTz } from "@/lib/server/env";

const bodySchema = z.object({ profileId: z.string().min(1) });

/**
 * Waves off the whole overdue pile for one profile — the backlog a break leaves behind. Today's
 * chores are untouched: only what is already being carried forward gets cleared.
 */
export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { profileId } = parsed.data;

  const today = getHouseholdToday(getHouseholdTz());
  const [chores, completions] = await Promise.all([listActiveChores(), listAllCompletions()]);

  const dismissals = await dismissOccurrences(
    carriedForwardOccurrencesForProfile(profileId, chores, completions, today),
    profileId,
    today,
    completions,
  );

  return NextResponse.json({ dismissals });
}
