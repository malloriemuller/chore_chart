"use client";

import Link from "next/link";
import { useKioskMode } from "@/lib/hooks/useKioskMode";

const SECTIONS = [
  { href: "/manage/profiles", emoji: "🧑‍🤝‍🧑", label: "Profiles" },
  { href: "/manage/chores", emoji: "✅", label: "Chores" },
  { href: "/manage/rewards", emoji: "🎁", label: "Rewards" },
  { href: "/manage/stars", emoji: "⭐", label: "Stars" },
  { href: "/styleguide", emoji: "🎨", label: "Styleguide" },
];

export default function ManagePage() {
  const [kiosk, setKiosk] = useKioskMode();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between rounded-card bg-surface p-4 shadow-card border border-[color:var(--card-border-color)]">
        <div>
          <p className="text-lg font-bold">Kiosk mode</p>
          <p className="text-sm text-text-muted">
            For this device only. Hides the tab bar, keeps the screen awake, and returns to Today after
            2 minutes idle.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={kiosk}
          onClick={() => setKiosk(!kiosk)}
          className={`h-10 w-16 shrink-0 rounded-full p-1 transition-colors ${kiosk ? "bg-success" : "bg-surface-2"}`}
        >
          <span
            className={`block h-8 w-8 rounded-full bg-white shadow-card transition-transform ${
              kiosk ? "translate-x-6" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="flex flex-col items-center gap-2 rounded-card bg-surface p-6 text-center shadow-card border border-[color:var(--card-border-color)]"
          >
            <span className="text-[40px]">{s.emoji}</span>
            <span className="text-lg font-bold">{s.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
