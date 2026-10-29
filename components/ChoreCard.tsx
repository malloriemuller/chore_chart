"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Checkbox } from "./Checkbox";
import { Confetti } from "./Confetti";
import { StarBadge } from "./StarBadge";

export function ChoreCard({
  emoji,
  title,
  dueTime,
  stars,
  done,
  interactive = true,
  overdueLabel,
  missed = false,
  dismissed = false,
  onToggle,
  onDismiss,
}: {
  emoji?: string;
  title: string;
  dueTime?: string;
  stars: number;
  done: boolean;
  interactive?: boolean;
  overdueLabel?: string;
  /** A skipped past day: shown as a record of what was missed, never actionable. */
  missed?: boolean;
  /** Waved off on purpose: settled for no stars, and it won't come back. */
  dismissed?: boolean;
  onToggle: () => void;
  /** Omitted where skipping isn't offered; the control only shows on an actionable card. */
  onDismiss?: () => void;
}) {
  const [burstKey, setBurstKey] = useState(0);
  const wasDone = useRef(done);
  const inert = done || missed || dismissed;

  useEffect(() => {
    if (!wasDone.current && done) setBurstKey((k) => k + 1);
    wasDone.current = done;
  }, [done]);

  return (
    <div
      className={`flex flex-col rounded-card bg-surface p-4 shadow-card border border-[color:var(--card-border-color)] transition-opacity ${
        inert ? "opacity-55" : ""
      } ${overdueLabel ? "border-l-4 border-l-danger" : ""}`}
    >
      <div className="flex items-center gap-3">
        {emoji && <span className="text-[32px] leading-none">{emoji}</span>}

        <div className="min-w-0 flex-1">
          <p className={`text-[22px] font-semibold ${inert ? "text-text-muted" : "text-text"}`}>{title}</p>
          {overdueLabel ? (
            <p className="text-sm font-semibold text-danger">from {overdueLabel}</p>
          ) : dismissed ? (
            <p className="text-sm font-semibold text-text-muted">skipped</p>
          ) : missed ? (
            <p className="text-sm font-semibold text-text-muted">missed</p>
          ) : (
            dueTime && <p className="text-sm text-text-muted">{dueTime}</p>
          )}
        </div>

        <StarBadge value={stars} />
        <div className="relative">
          <Confetti burstKey={burstKey} />
          <Checkbox
            checked={done}
            disabled={!interactive}
            onToggle={onToggle}
            label={`${title}, ${done ? "done" : dismissed ? "skipped" : missed ? "missed" : "not done"}`}
          />
        </div>
      </div>

      {onDismiss && interactive && (
        <div className="mt-1 flex justify-end">
          <button
            type="button"
            onClick={onDismiss}
            aria-label={`Skip ${title}, no stars`}
            className="flex h-9 items-center gap-1 rounded-full px-3 text-[14px] font-bold text-text-muted"
          >
            <X className="h-4 w-4" strokeWidth={3} aria-hidden />
            Skip
          </button>
        </div>
      )}
    </div>
  );
}
