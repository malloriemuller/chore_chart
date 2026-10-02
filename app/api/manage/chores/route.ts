import { NextResponse, type NextRequest } from "next/server";
import { createChore, listAllChores } from "@/lib/airtable/repositories/chores";
import { choreInputSchema } from "@/lib/validation/chore";

export async function GET() {
  const chores = await listAllChores();
  return NextResponse.json({ chores });
}

export async function POST(request: NextRequest) {
  const parsed = choreInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }
  const input = parsed.data;
  const nextDueDate = input.repeatMode === "after_completion" ? input.startDate : undefined;
  const chore = await createChore({ ...input, nextDueDate });
  return NextResponse.json({ chore });
}
