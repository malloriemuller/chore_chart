"use client";

import { useSyncExternalStore } from "react";
import { formatLocalDate } from "@/lib/domain/dates";

function subscribe(): () => void {
  // The device's current date doesn't need live updates here: it's only a bootstrap guess used
  // until the server's authoritative `today` (household-timezone) arrives.
  return () => {};
}

function getSnapshot(): string {
  return formatLocalDate(new Date());
}

function getServerSnapshot(): string | null {
  return null; // Unknown on the server (and server/client timezones may differ); fills in post-hydration.
}

/**
 * The browser's own guess at "today" (YYYY-MM-DD), used only to bootstrap a board fetch before
 * the household's authoritative `today` is known. Null during SSR and the initial hydration pass,
 * so no server/client date mismatch is ever rendered.
 */
export function useClientGuessDate(): string | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
