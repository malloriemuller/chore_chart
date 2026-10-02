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
  online = true,
}: {
  profile: Profile;
  board: ProfileBoard;
  balance: number;
  overdueDateLabel: (occurrenceDate: string) => string;
  onToggle: (choreId: string, occurrenceDate: string, status: "due" | "overdue") => void;
  online?: boolean;
}) {
  return (
    <ProfileColorScope hex={profile.color} className="flex w-[300px] shrink-0 snap-start flex-col gap-3">
      <ColumnHeader emoji={profile.emoji} name={profile.name} balance={balance} />

      <div className="flex flex-1 flex-col gap-4 rounded-column bg-[var(--profile-tint)] p-3">
        {board.overdue.length > 0 && (
          <div className="flex flex-col gap-2">
            <SectionLabel>Overdue</SectionLabel>
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
                interactive={occurrence.status === "due" && online}
                onToggle={() => onToggle(chore.id, occurrence.occurrenceDate, "due")}
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
