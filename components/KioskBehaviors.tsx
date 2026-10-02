"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useKioskMode } from "@/lib/hooks/useKioskMode";
import { useWakeLock } from "@/lib/hooks/useWakeLock";

const IDLE_MS = 2 * 60 * 1000;
const ACTIVITY_EVENTS = ["pointerdown", "keydown", "touchstart"] as const;

function msUntilNext3am(): number {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 3, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

/** Mounted once at the root: wake lock, idle-return-to-Today, and the daily 3am reload. */
export function KioskBehaviors() {
  const [kiosk] = useKioskMode();
  const router = useRouter();
  const pathname = usePathname();
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useWakeLock(kiosk);

  useEffect(() => {
    if (!kiosk) return;

    function resetIdleTimer() {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => router.push("/"), IDLE_MS);
    }

    for (const event of ACTIVITY_EVENTS) window.addEventListener(event, resetIdleTimer);
    resetIdleTimer();

    return () => {
      for (const event of ACTIVITY_EVENTS) window.removeEventListener(event, resetIdleTimer);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [kiosk, router, pathname]);

  useEffect(() => {
    if (!kiosk) return;
    const timer = setTimeout(() => window.location.reload(), msUntilNext3am());
    return () => clearTimeout(timer);
  }, [kiosk]);

  return null;
}
