import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { AirtableError } from "@/lib/airtable/client";
import { deleteCompletion, getCompletionById } from "@/lib/airtable/repositories/completions";
import { getChore, updateChore } from "@/lib/airtable/repositories/chores";
import { getHouseholdToday } from "@/lib/domain/clock";
import { canUndo } from "@/lib/domain/completions";
import { getHouseholdTz } from "@/lib/server/env";

const bodySchema = z.object({
  completionId: z.string().min(1),
  previousNextDueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { completionId, previousNextDueDate } = parsed.data;

  let completion;
  try {
    completion = await getCompletionById(completionId);
  } catch (error) {
    if (error instanceof AirtableError && error.status === 404) {
      return NextResponse.json({ error: "Completion not found." }, { status: 404 });
    }
    throw error;
  }

  const today = getHouseholdToday(getHouseholdTz());
  if (!canUndo(completion, today)) {
    return NextResponse.json({ error: "Can only undo a completion made today." }, { status: 403 });
  }

  await deleteCompletion(completionId);

  const chore = await getChore(completion.choreId);
  if (chore?.repeatMode === "after_completion" && previousNextDueDate) {
    await updateChore(chore.id, { nextDueDate: previousNextDueDate });
  }

  return NextResponse.json({ ok: true });
}
