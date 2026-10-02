import { NextResponse, type NextRequest } from "next/server";
import { createProfile, listAllProfiles } from "@/lib/airtable/repositories/profiles";
import { profileInputSchema } from "@/lib/validation/profile";

export async function GET() {
  const profiles = await listAllProfiles();
  return NextResponse.json({ profiles });
}

export async function POST(request: NextRequest) {
  const parsed = profileInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }
  const profile = await createProfile(parsed.data);
  return NextResponse.json({ profile });
}
