import { NextResponse, type NextRequest } from "next/server";
import { updateReward } from "@/lib/airtable/repositories/rewards";
import { rewardPatchSchema } from "@/lib/validation/reward";

export async function PATCH(request: NextRequest, context: RouteContext<"/api/manage/rewards/[id]">) {
  const { id } = await context.params;
  const parsed = rewardPatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }
  const reward = await updateReward(id, parsed.data);
  return NextResponse.json({ reward });
}
