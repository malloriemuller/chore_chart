"use client";

import { ChoreCard } from "./ChoreCard";
import { ColumnHeader } from "./ColumnHeader";
import { ProfileColorScope } from "./ProfileColorScope";
import { SectionLabel } from "./SectionLabel";
import type { ProfileBoard } from "@/lib/client/boardGrouping";
import type { Profile } from "@/lib/domain/types";

export function ProfileColumn({
  profile,
  board,
  balance,
  overdueDateLabel,
  onToggle,
  onDismiss,
  onClearOverdue,
  online = true,
}: {
  profile: Profile;
  board: ProfileBoard;
  balance: number;
  overdueDateLabel: (occurrenceDate: string) => string;
  onToggle: (choreId: string, occurrenceDate: string, status: "due" | "overdue") => void;
  onDismiss: (choreId: string, occurrenceDate: string) => void;
  onClearOverdue: () => void;
  online?: boolean;
}) {
  return (
    <ProfileColorScope hex={profile.color} className="flex w-[300px] shrink-0 snap-start flex-col gap-3">
      <ColumnHeader emoji={profile.emoji} name={profile.name} balance={balance} />

      <div className="flex flex-1 flex-col gap-4 rounded-column bg-[var(--profile-tint)] p-3">
        {board.overdue.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <SectionLabel>Overdue</SectionLabel>
              </div>
              {online && (
                <button
                  type="button"
                  onClick={onClearOverdue}
                  className="h-9 shrink-0 rounded-full bg-surface px-3 text-[14px] font-bold text-text-muted"
                >
                  Skip all ({board.overdue.length})
                </button>
              )}
            </div>
            {board.overdue.map(({ chore, occurrence }) => (
              <ChoreCard
                key={`${chore.id}:${occurrence.occurrenceDate}`}
                emoji={chore.emoji}
                title={chore.title}
                stars={chore.stars}
                done={false}
                interactive={online}
                overdueLabel={overdueDateLabel(occurrence.occurrenceDate)}
                onToggle={() => onToggle(chore.id, occurrence.occurrenceDate, "overdue")}
                onDismiss={() => onDismiss(chore.id, occurrence.occurrenceDate)}
              />
            ))}
          </div>
        )}

        {board.sections.map((section) => (
          <div key={section.time} className="flex flex-col gap-2">
            <SectionLabel>{section.label}</SectionLabel>
            {section.rows.map(({ chore, occurrence }) => (
              <ChoreCard
                key={`${chore.id}:${occurrence.occurrenceDate}`}
                emoji={chore.emoji}
                title={chore.title}
                dueTime={chore.dueTime}
                stars={chore.stars}
                done={occurrence.status === "done"}
                missed={occurrence.status === "missed"}
                dismissed={occurrence.status === "dismissed"}
                interactive={occurrence.status === "due" && online}
                onToggle={() => onToggle(chore.id, occurrence.occurrenceDate, "due")}
                onDismiss={() => onDismiss(chore.id, occurrence.occurrenceDate)}
              />
            ))}
          </div>
        ))}

        {board.overdue.length === 0 && board.sections.length === 0 && (
          <p className="p-4 text-center text-base text-text-muted">All done for now 🎉</p>
        )}
      </div>
    </ProfileColorScope>
  );
}
