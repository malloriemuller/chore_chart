"use client";

import { useOnlineStatus } from "@/lib/hooks/useOnlineStatus";

export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-50 bg-danger px-4 py-2 text-center text-sm font-bold text-white">
      You&rsquo;re offline. Check-offs are paused until the connection comes back.
    </div>
  );
}
