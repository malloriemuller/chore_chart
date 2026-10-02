import { constantTimeEqual, sign, verify } from "./crypto";

export const COOKIE_NAMES = {
  household: "cb_household",
  parent: "cb_parent",
} as const;

export const MAX_AGE_SECONDS = {
  household: 60 * 60 * 24 * 365, // 1 year
  parent: 60 * 10, // 10 minutes, refreshed on every request (sliding expiration)
} as const;

const HOUSEHOLD_TOKEN = "household-unlocked";
const PARENT_TOKEN = "parent-mode";

function requireSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("Missing SESSION_SECRET environment variable");
  return secret;
}

export function checkHouseholdPin(pin: string): boolean {
  return constantTimeEqual(pin, process.env.HOUSEHOLD_PIN ?? "");
}

export function checkParentPin(pin: string): boolean {
  return constantTimeEqual(pin, process.env.PARENT_PIN ?? "");
}

export function createHouseholdCookieValue(): string {
  return sign(HOUSEHOLD_TOKEN, requireSecret());
}

export function createParentCookieValue(): string {
  return sign(PARENT_TOKEN, requireSecret());
}

export function isHouseholdCookieValid(value: string | undefined): boolean {
  if (!value) return false;
  return verify(value, requireSecret()) === HOUSEHOLD_TOKEN;
}

export function isParentCookieValid(value: string | undefined): boolean {
  if (!value) return false;
  return verify(value, requireSecret()) === PARENT_TOKEN;
}
