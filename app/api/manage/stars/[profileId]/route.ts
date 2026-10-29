import { NextResponse } from "next/server";
import { listBonusesForProfile } from "@/lib/airtable/repositories/bonuses";
import { listCompletionsForProfile } from "@/lib/airtable/repositories/completions";
import { listRedemptionsForProfile } from "@/lib/airtable/repositories/redemptions";

export async function GET(_request: Request, context: RouteContext<"/api/manage/stars/[profileId]">) {
  const { profileId } = await context.params;
  const [completions, redemptions, bonuses] = await Promise.all([
    listCompletionsForProfile(profileId),
    listRedemptionsForProfile(profileId),
    listBonusesForProfile(profileId),
  ]);
  return NextResponse.json({ completions, redemptions, bonuses });
}
