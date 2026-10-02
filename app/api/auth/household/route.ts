import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { COOKIE_NAMES, MAX_AGE_SECONDS, checkHouseholdPin, createHouseholdCookieValue } from "@/lib/auth/pins";
import { clientKeyFromHeaders, registerPinAttempt } from "@/lib/auth/rateLimiter";

const bodySchema = z.object({ pin: z.string().regex(/^\d{4,6}$/) });

export async function POST(request: NextRequest) {
  const key = `household:${clientKeyFromHeaders(request.headers)}`;
  if (!registerPinAttempt(key)) {
    return NextResponse.json({ error: "Too many attempts. Try again in a minute." }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid PIN." }, { status: 400 });
  }

  if (!checkHouseholdPin(parsed.data.pin)) {
    return NextResponse.json({ error: "Incorrect PIN." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAMES.household, createHouseholdCookieValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE_SECONDS.household,
    path: "/",
  });
  return response;
}
