import { NextResponse } from "next/server";
import { listCompletionsForProfile } from "@/lib/airtable/repositories/completions";
import { listRedemptionsForProfile } from "@/lib/airtable/repositories/redemptions";

export async function GET(_request: Request, context: RouteContext<"/api/manage/stars/[profileId]">) {
  const { profileId } = await context.params;
  const [completions, redemptions] = await Promise.all([
    listCompletionsForProfile(profileId),
    listRedemptionsForProfile(profileId),
  ]);
  return NextResponse.json({ completions, redemptions });
}
