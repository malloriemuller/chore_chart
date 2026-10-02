export function BoardSkeleton({ columns = 3 }: { columns?: number }) {
  return (
    <div className="flex flex-1 gap-4 overflow-hidden pb-4" aria-hidden>
      {Array.from({ length: columns }).map((_, col) => (
        <div key={col} className="flex w-[300px] shrink-0 flex-col gap-3">
          <div className="h-[76px] animate-pulse rounded-column bg-surface-2" />
          <div className="flex flex-1 flex-col gap-3 rounded-column bg-surface-2/50 p-3">
            {Array.from({ length: 3 }).map((_, row) => (
              <div key={row} className="h-20 animate-pulse rounded-card bg-surface-2" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
