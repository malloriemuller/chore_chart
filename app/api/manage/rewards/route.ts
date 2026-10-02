import { NextResponse, type NextRequest } from "next/server";
import { createReward, listAllRewards } from "@/lib/airtable/repositories/rewards";
import { rewardInputSchema } from "@/lib/validation/reward";

export async function GET() {
  const rewards = await listAllRewards();
  return NextResponse.json({ rewards });
}

export async function POST(request: NextRequest) {
  const parsed = rewardInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }
  const reward = await createReward(parsed.data);
  return NextResponse.json({ reward });
}
