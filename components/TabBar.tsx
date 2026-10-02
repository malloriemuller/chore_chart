"use client";

import { Gift, Home, CalendarRange, Lock } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useKioskMode } from "@/lib/hooks/useKioskMode";

export function TabBar({ weekHref }: { weekHref: string }) {
  const pathname = usePathname();
  const [kiosk] = useKioskMode();

  const tabs = [
    { href: "/", label: "Today", icon: Home, active: pathname === "/" },
    { href: weekHref, label: "Week", icon: CalendarRange, active: pathname.startsWith("/week") },
    { href: "/rewards", label: "Rewards", icon: Gift, active: pathname === "/rewards" },
    { href: "/manage", label: "Manage", icon: Lock, active: pathname.startsWith("/manage") },
  ];

  if (kiosk) {
    const kidTabs = tabs.slice(0, 3);
    return (
      <>
        <nav className="fixed inset-x-0 bottom-4 z-20 flex justify-center">
          <div className="flex items-center gap-1 rounded-full bg-surface/60 p-1.5 shadow-card backdrop-blur">
            {kidTabs.map(({ href, label, icon: Icon, active }) => (
              <Link
                key={label}
                href={href}
                aria-label={label}
                className={`flex h-14 w-14 items-center justify-center rounded-full transition-colors ${
                  active ? "bg-surface-2 text-text" : "text-text-muted"
                }`}
              >
                <Icon size={20} strokeWidth={2} />
              </Link>
            ))}
          </div>
        </nav>
        <Link
          href="/manage"
          aria-label="Manage"
          className="fixed bottom-4 right-4 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-surface/60 text-text-muted shadow-card backdrop-blur"
        >
          <Lock size={18} />
        </Link>
      </>
    );
  }

  return (
    <nav className="fixed inset-x-0 bottom-4 z-20 flex justify-center">
      <div className="flex items-center gap-1 rounded-full bg-surface/85 p-1.5 shadow-card backdrop-blur">
        {tabs.map(({ href, label, icon: Icon, active }) => (
          <Link
            key={label}
            href={href}
            className={`flex h-14 items-center gap-2 rounded-full px-4 text-sm font-bold transition-colors ${
              active ? "bg-surface-2 text-text" : "text-text-muted"
            }`}
          >
            <Icon size={20} strokeWidth={2} />
            <span className="hidden sm:inline">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
