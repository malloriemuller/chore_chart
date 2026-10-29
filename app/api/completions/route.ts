import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createCompletion, findCompletionByKey } from "@/lib/airtable/repositories/completions";
import { getChore, updateChore } from "@/lib/airtable/repositories/chores";
import { getHouseholdToday } from "@/lib/domain/clock";
import { completeOccurrence } from "@/lib/domain/completions";
import { completionKey } from "@/lib/domain/status";
import { getHouseholdTz } from "@/lib/server/env";

const bodySchema = z.object({
  choreId: z.string().min(1),
  profileId: z.string().min(1),
  occurrenceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { choreId, profileId, occurrenceDate } = parsed.data;

  const chore = await getChore(choreId);
  if (!chore || chore.archived) {
    return NextResponse.json({ error: "Chore not found." }, { status: 404 });
  }

  const today = getHouseholdToday(getHouseholdTz());
  const existing = await findCompletionByKey(completionKey(choreId, occurrenceDate));

  const result = completeOccurrence({
    chore,
    profileId,
    occurrenceDate,
    today,
    existingCompletions: existing ? [existing] : [],
    newId: () => "pending",
  });

  if (result.alreadyCompleted) {
    return NextResponse.json({ completion: result.completion, alreadyCompleted: true });
  }

  const created = await createCompletion({
    key: result.completion.key,
    choreId: result.completion.choreId,
    profileId: result.completion.profileId,
    occurrenceDate: result.completion.occurrenceDate,
    completedDate: result.completion.completedDate,
    starsAwarded: result.completion.starsAwarded,
    dismissed: result.completion.dismissed,
  });

  if (chore.repeatMode === "after_completion" && result.nextNextDueDate) {
    await updateChore(chore.id, { nextDueDate: result.nextNextDueDate });
  }

  return NextResponse.json({
    completion: created,
    alreadyCompleted: false,
    previousNextDueDate: result.previousNextDueDate,
  });
}
