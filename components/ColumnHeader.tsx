import { StarBadge } from "./StarBadge";

export function ColumnHeader({
  emoji,
  name,
  balance,
}: {
  emoji: string;
  name: string;
  balance: number;
}) {
  return (
    <div className="flex w-full items-center gap-3 rounded-column bg-[var(--profile-base)] px-4 py-3">
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-3xl">
        {emoji}
      </span>
      <span className="flex-1 truncate text-[24px] font-extrabold text-white">{name}</span>
      <StarBadge value={balance} tone="onColor" />
    </div>
  );
}
