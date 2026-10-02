"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { BoardSkeleton } from "@/components/BoardSkeleton";
import { ErrorState } from "@/components/ErrorState";
import { ProfileColumn } from "@/components/ProfileColumn";
import { TabBar } from "@/components/TabBar";
import { Toast } from "@/components/Toast";
import { groupBoardForProfile } from "@/lib/client/boardGrouping";
import { fetcher } from "@/lib/client/fetcher";
import { useChoreCompletion } from "@/lib/client/useChoreCompletion";
import { addCalendarDays, formatLocalDate, parseLocalDate } from "@/lib/domain/dates";
import { useClientGuessDate } from "@/lib/hooks/useClientGuessDate";
import { useKioskMode } from "@/lib/hooks/useKioskMode";
import { useOnlineStatus } from "@/lib/hooks/useOnlineStatus";
import type { BoardResponse } from "@/lib/server/board";

const POLL_INTERVAL_MS = 15_000;

function formatHeaderDate(viewDate: string): string {
  const date = parseLocalDate(viewDate);
  return date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

function formatOverdueLabel(occurrenceDate: string): string {
  return parseLocalDate(occurrenceDate).toLocaleDateString(undefined, { weekday: "short" });
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function TodayPage() {
  // null = auto-follow the household's real "today" (and its midnight rollover); a date = the
  // user explicitly navigated, which stops following until they tap "Today" again.
  const [manualViewDate, setManualViewDate] = useState<string | null>(null);
  // Null only for the instant before hydration settles, so SSR never renders a guessed date that
  // could disagree with the server's own timezone.
  const clientGuessDate = useClientGuessDate();
  const [kiosk] = useKioskMode();
  const online = useOnlineStatus();

  const boundDate = manualViewDate ?? clientGuessDate;
  const key = boundDate ? `/api/board?start=${boundDate}&end=${boundDate}` : null;
  const { data, error: boardError, mutate } = useSWR<BoardResponse>(key, fetcher, {
    refreshInterval: POLL_INTERVAL_MS,
    revalidateOnFocus: true,
  });

  const { pendingUndo, handleToggle, handleUndo, error: mutationError } = useChoreCompletion(data, mutate);

  const viewDate = manualViewDate ?? data?.today ?? clientGuessDate;

  function goToDay(offset: number) {
    if (!viewDate) return;
    setManualViewDate(formatLocalDate(addCalendarDays(parseLocalDate(viewDate), offset)));
  }

  function goToToday() {
    setManualViewDate(null);
  }

  const weekHref = data?.profiles[0] ? `/week/${data.profiles[0].id}` : "/manage";

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 pb-28 sm:p-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          {kiosk && <p className="text-lg font-semibold text-text-muted">{greeting()}</p>}
          <h1 className="text-[32px] font-extrabold">{viewDate && formatHeaderDate(viewDate)}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goToDay(-1)}
            aria-label="Previous day"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-2"
          >
            <ChevronLeft />
          </button>
          <button
            type="button"
            onClick={goToToday}
            className="h-14 rounded-full bg-surface-2 px-5 text-lg font-bold"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => goToDay(1)}
            aria-label="Next day"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-2"
          >
            <ChevronRight />
          </button>
        </div>
      </header>

      {boardError ? (
        <ErrorState message="Couldn't load today's board." onRetry={() => mutate()} />
      ) : !data ? (
        <BoardSkeleton />
      ) : data.profiles.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
          <p className="text-lg text-text-muted">No one&apos;s set up yet.</p>
          <Link href="/manage/profiles" className="rounded-full bg-surface-2 px-5 py-3 text-lg font-bold">
            Add a profile
          </Link>
        </div>
      ) : (
        <div className={`flex flex-1 gap-4 overflow-x-auto snap-x pb-4 ${kiosk ? "mx-auto w-full max-w-[1366px]" : ""}`}>
          {data.profiles.map((profile) => (
            <ProfileColumn
              key={profile.id}
              profile={profile}
              board={groupBoardForProfile(profile.id, data.occurrences, data.chores)}
              balance={data.balances[profile.id] ?? 0}
              overdueDateLabel={formatOverdueLabel}
              onToggle={handleToggle}
              online={online}
            />
          ))}
        </div>
      )}

      <TabBar weekHref={weekHref} />

      {mutationError ? (
        <Toast message={mutationError} />
      ) : (
        pendingUndo && <Toast message={`${pendingUndo.message} done!`} actionLabel="Undo" onAction={handleUndo} />
      )}
    </main>
  );
}
