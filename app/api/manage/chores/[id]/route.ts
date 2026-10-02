import { NextResponse, type NextRequest } from "next/server";
import { deleteChore, updateChore } from "@/lib/airtable/repositories/chores";
import { chorePatchSchema } from "@/lib/validation/chore";

export async function PATCH(request: NextRequest, context: RouteContext<"/api/manage/chores/[id]">) {
  const { id } = await context.params;
  const parsed = chorePatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }
  const chore = await updateChore(id, parsed.data);
  return NextResponse.json({ chore });
}

export async function DELETE(_request: NextRequest, context: RouteContext<"/api/manage/chores/[id]">) {
  const { id } = await context.params;
  await deleteChore(id);
  return NextResponse.json({ ok: true });
}
