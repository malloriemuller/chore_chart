"use client";

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
  onToggle,
}: {
  emoji?: string;
  title: string;
  dueTime?: string;
  stars: number;
  done: boolean;
  interactive?: boolean;
  overdueLabel?: string;
  onToggle: () => void;
}) {
  const [burstKey, setBurstKey] = useState(0);
  const wasDone = useRef(done);

  useEffect(() => {
    if (!wasDone.current && done) setBurstKey((k) => k + 1);
    wasDone.current = done;
  }, [done]);

  return (
    <div
      className={`flex items-center gap-3 rounded-card bg-surface p-4 shadow-card border border-[color:var(--card-border-color)] transition-opacity ${
        done ? "opacity-55" : ""
      } ${overdueLabel ? "border-l-4 border-l-danger" : ""}`}
    >
      {emoji && <span className="text-[32px] leading-none">{emoji}</span>}

      <div className="min-w-0 flex-1">
        <p className={`text-[22px] font-semibold ${done ? "text-text-muted" : "text-text"}`}>{title}</p>
        {overdueLabel ? (
          <p className="text-sm font-semibold text-danger">from {overdueLabel}</p>
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
          label={`${title}, ${done ? "done" : "not done"}`}
        />
      </div>
    </div>
  );
}
