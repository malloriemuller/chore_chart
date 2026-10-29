import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { listAllBonuses } from "@/lib/airtable/repositories/bonuses";
import { listAllCompletions } from "@/lib/airtable/repositories/completions";
import { getProfile } from "@/lib/airtable/repositories/profiles";
import { listAllRedemptions, createRedemption } from "@/lib/airtable/repositories/redemptions";
import { getReward } from "@/lib/airtable/repositories/rewards";
import { getHouseholdToday } from "@/lib/domain/clock";
import { canRedeem } from "@/lib/domain/stars";
import { getHouseholdTz } from "@/lib/server/env";

const bodySchema = z.object({
  rewardId: z.string().min(1),
  profileId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { rewardId, profileId } = parsed.data;

  const [reward, profile] = await Promise.all([getReward(rewardId), getProfile(profileId)]);
  if (!reward || reward.archived) {
    return NextResponse.json({ error: "Reward not found." }, { status: 404 });
  }
  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }
  if (reward.profileId && reward.profileId !== profileId) {
    return NextResponse.json({ error: "This reward isn't available to this child." }, { status: 403 });
  }

  const [completions, redemptions, bonuses] = await Promise.all([
    listAllCompletions(),
    listAllRedemptions(),
    listAllBonuses(),
  ]);
  if (!canRedeem(profileId, reward.cost, { completions, redemptions, bonuses })) {
    return NextResponse.json({ error: "Not enough stars." }, { status: 400 });
  }

  const redemption = await createRedemption({
    label: `${reward.name} – ${profile.name}`,
    rewardId: reward.id,
    profileId: profile.id,
    cost: reward.cost,
    redeemedDate: getHouseholdToday(getHouseholdTz()),
  });

  return NextResponse.json({ redemption });
}
