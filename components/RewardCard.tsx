"use client";

import { StarBadge } from "./StarBadge";

export function RewardCard({
  emoji,
  name,
  cost,
  balance,
  onRedeem,
}: {
  emoji?: string;
  name: string;
  cost: number;
  balance: number;
  onRedeem: () => void;
}) {
  const affordable = balance >= cost;
  const progress = Math.min(100, Math.round((balance / cost) * 100));

  return (
    <div className="flex flex-col items-center gap-3 rounded-card bg-surface p-4 shadow-card border border-[color:var(--card-border-color)] text-center">
      {emoji && <span className="text-[48px] leading-none">{emoji}</span>}
      <p className="text-[22px] font-semibold text-text">{name}</p>
      <StarBadge value={cost} />

      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full"
          style={{ width: `${progress}%`, backgroundColor: "var(--profile-base)" }}
        />
      </div>

      <button
        type="button"
        disabled={!affordable}
        onClick={onRedeem}
        className={`w-full rounded-full px-4 py-3 text-lg font-bold transition-colors ${
          affordable
            ? "animate-pulse-gentle bg-[var(--profile-base)] text-white"
            : "bg-surface-2 text-text-muted"
        }`}
      >
        Redeem
      </button>
    </div>
  );
}
