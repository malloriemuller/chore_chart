import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getChore, updateChore } from "@/lib/airtable/repositories/chores";
import { deleteCompletions, listAllCompletions } from "@/lib/airtable/repositories/completions";
import { getHouseholdToday } from "@/lib/domain/clock";
import { canUndo } from "@/lib/domain/completions";
import type { Completion } from "@/lib/domain/types";
import { getHouseholdTz } from "@/lib/server/env";

const entrySchema = z.object({
  completionId: z.string().min(1),
  previousNextDueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

/** One entry per record to roll back, so undoing a cleared overdue pile is a single request. */
const bodySchema = z.object({ completions: z.array(entrySchema).min(1).max(100) });

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const today = getHouseholdToday(getHouseholdTz());
  const byId = new Map((await listAllCompletions()).map((c) => [c.id, c]));

  const resolved: { completion: Completion; previousNextDueDate?: string }[] = [];
  for (const entry of parsed.data.completions) {
    const completion = byId.get(entry.completionId);
    if (!completion) {
      return NextResponse.json({ error: "Completion not found." }, { status: 404 });
    }
    if (!canUndo(completion, today)) {
      return NextResponse.json({ error: "Can only undo a completion made today." }, { status: 403 });
    }
    resolved.push({ completion, previousNextDueDate: entry.previousNextDueDate });
  }

  await deleteCompletions(resolved.map(({ completion }) => completion.id));

  for (const { completion, previousNextDueDate } of resolved) {
    if (!previousNextDueDate) continue;
    const chore = await getChore(completion.choreId);
    if (chore?.repeatMode === "after_completion") {
      await updateChore(chore.id, { nextDueDate: previousNextDueDate });
    }
  }

  return NextResponse.json({ ok: true });
}
