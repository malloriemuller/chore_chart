import { NextResponse, type NextRequest } from "next/server";
import { updateProfile } from "@/lib/airtable/repositories/profiles";
import { profilePatchSchema } from "@/lib/validation/profile";

export async function PATCH(request: NextRequest, context: RouteContext<"/api/manage/profiles/[id]">) {
  const { id } = await context.params;
  const parsed = profilePatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }
  const profile = await updateProfile(id, parsed.data);
  return NextResponse.json({ profile });
}
