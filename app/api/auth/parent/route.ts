import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { COOKIE_NAMES, MAX_AGE_SECONDS, checkParentPin, createParentCookieValue } from "@/lib/auth/pins";
import { clientKeyFromHeaders, registerPinAttempt } from "@/lib/auth/rateLimiter";

const bodySchema = z.object({ pin: z.string().regex(/^\d{4,6}$/) });

export async function POST(request: NextRequest) {
  const key = `parent:${clientKeyFromHeaders(request.headers)}`;
  if (!registerPinAttempt(key)) {
    return NextResponse.json({ error: "Too many attempts. Try again in a minute." }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid PIN." }, { status: 400 });
  }

  if (!checkParentPin(parsed.data.pin)) {
    return NextResponse.json({ error: "Incorrect PIN." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAMES.parent, createParentCookieValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE_SECONDS.parent,
    path: "/",
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAMES.parent, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}
