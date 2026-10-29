import { NextResponse, type NextRequest } from "next/server";
import { createBonus } from "@/lib/airtable/repositories/bonuses";
import { getProfile } from "@/lib/airtable/repositories/profiles";
import { getHouseholdToday } from "@/lib/domain/clock";
import { getHouseholdTz } from "@/lib/server/env";
import { bonusInputSchema } from "@/lib/validation/bonus";

/** Parent mode only: /api/manage is behind the parent PIN (see proxy.ts). */
export async function POST(request: NextRequest) {
  const parsed = bonusInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }
  const { profileId, label, stars } = parsed.data;

  const profile = await getProfile(profileId);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  const bonus = await createBonus({
    label,
    profileId,
    stars,
    awardedDate: getHouseholdToday(getHouseholdTz()),
  });

  return NextResponse.json({ bonus });
}
