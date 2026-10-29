import { NextResponse } from "next/server";
import { deleteBonus } from "@/lib/airtable/repositories/bonuses";

/** Bonuses are the one ledger entry that can be taken back outright, since nothing else refers to them. */
export async function DELETE(_request: Request, context: RouteContext<"/api/manage/bonuses/[id]">) {
  const { id } = await context.params;
  await deleteBonus(id);
  return NextResponse.json({ ok: true });
}
