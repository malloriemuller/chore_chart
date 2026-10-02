import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAMES, MAX_AGE_SECONDS, isHouseholdCookieValid, isParentCookieValid } from "@/lib/auth/pins";

const HOUSEHOLD_BYPASS_PATHS = ["/pin", "/api/auth/household"];

function isHouseholdBypass(pathname: string): boolean {
  return HOUSEHOLD_BYPASS_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function requiresParentMode(pathname: string): boolean {
  if (pathname.startsWith("/api/auth/parent")) return false;
  return pathname.startsWith("/api/manage") || pathname.startsWith("/api/redemptions");
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api/");

  const householdCookie = request.cookies.get(COOKIE_NAMES.household)?.value;
  const householdOk = isHouseholdCookieValid(householdCookie);

  if (!householdOk && !isHouseholdBypass(pathname)) {
    if (isApi) {
      return NextResponse.json({ error: "Household PIN required." }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/pin";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const parentCookie = request.cookies.get(COOKIE_NAMES.parent)?.value;
  const parentOk = isParentCookieValid(parentCookie);

  if (requiresParentMode(pathname) && !parentOk) {
    return NextResponse.json({ error: "Parent PIN required." }, { status: 403 });
  }

  const response = NextResponse.next();

  // Sliding expiration: any request while in parent mode pushes the 10-minute window out.
  if (parentOk && parentCookie) {
    response.cookies.set(COOKIE_NAMES.parent, parentCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: MAX_AGE_SECONDS.parent,
      path: "/",
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons).*)"],
};
