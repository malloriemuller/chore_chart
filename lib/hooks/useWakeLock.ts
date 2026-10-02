"use client";

import { useEffect } from "react";

export function useWakeLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled || !("wakeLock" in navigator)) return;

    let sentinel: WakeLockSentinel | null = null;

    async function acquire() {
      try {
        sentinel = await navigator.wakeLock.request("screen");
      } catch {
        // Not all browsers/contexts grant it (e.g. tab not visible); harmless to skip.
      }
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") void acquire();
    }

    void acquire();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      void sentinel?.release();
    };
  }, [enabled]);
}
