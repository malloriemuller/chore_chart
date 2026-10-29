"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { BoardSkeleton } from "@/components/BoardSkeleton";
import { ChoreCard } from "@/components/ChoreCard";
import { ErrorState } from "@/components/ErrorState";
import { ProfileColorScope } from "@/components/ProfileColorScope";
import { TabBar } from "@/components/TabBar";
import { Toast } from "@/components/Toast";
import { fetcher } from "@/lib/client/fetcher";
import { useChoreCompletion } from "@/lib/client/useChoreCompletion";
import { groupWeekForProfile } from "@/lib/client/weekGrouping";
import { addCalendarDays, formatLocalDate, parseLocalDate, startOfWeekSunday } from "@/lib/domain/dates";
import { useClientGuessDate } from "@/lib/hooks/useClientGuessDate";
import { useOnlineStatus } from "@/lib/hooks/useOnlineStatus";
import type { BoardResponse } from "@/lib/server/board";

const POLL_INTERVAL_MS = 15_000;

function sundayOf(date: string): string {
  return formatLocalDate(startOfWeekSunday(parseLocalDate(date)));
}

function formatDayLabel(date: string): { weekday: string; day: string } {
  const d = parseLocalDate(date);
  return {
    weekday: d.toLocaleDateString(undefined, { weekday: "short" }),
    day: d.toLocaleDateString(undefined, { day: "numeric" }),
  };
}

function formatOverdueLabel(occurrenceDate: string): string {
  return parseLocalDate(occurrenceDate).toLocaleDateString(undefined, { weekday: "short" });
}

export function WeekView({
  profileId,
  initialWeekStart,
}: {
  profileId: string;
  initialWeekStart?: string;
}) {
  const [manualWeekStart, setManualWeekStart] = useState<string | null>(initialWeekStart ?? null);
  // Null only for the instant before hydration settles, so SSR never renders a guessed date that
  // could disagree with the server's own timezone.
  const clientGuessDate = useClientGuessDate();
  const online = useOnlineStatus();

  // The SWR key needs a week before `data` (and the real household "today") exists yet, so it
  // falls back to the browser's own guess; once data loads we auto-follow the real week instead.
  const keyWeekStart = manualWeekStart ?? (clientGuessDate ? sundayOf(clientGuessDate) : null);
  const keyWeekDates = keyWeekStart
    ? Array.from({ length: 7 }, (_, i) => formatLocalDate(addCalendarDays(parseLocalDate(keyWeekStart), i)))
    : null;

  const key = keyWeekDates ? `/api/board?start=${keyWeekDates[0]}&end=${keyWeekDates[6]}` : null;
  const { data, error: boardError, mutate } = useSWR<BoardResponse>(key, fetcher, {
    refreshInterval: POLL_INTERVAL_MS,
    revalidateOnFocus: true,
  });

  const { pendingUndo, handleToggle, handleDismiss, handleUndo, error: mutationError } = useChoreCompletion(
    data,
    mutate,
  );

  const effectiveWeekStart = manualWeekStart ?? (data ? sundayOf(data.today) : keyWeekStart);
  const effectiveWeekDates =
    effectiveWeekStart && effectiveWeekStart === keyWeekStart
      ? keyWeekDates
      : effectiveWeekStart
        ? Array.from({ length: 7 }, (_, i) => formatLocalDate(addCalendarDays(parseLocalDate(effectiveWeekStart), i)))
        : null;

  function goToWeek(offsetWeeks: number) {
    if (!effectiveWeekStart) return;
    setManualWeekStart(formatLocalDate(addCalendarDays(parseLocalDate(effectiveWeekStart), offsetWeeks * 7)));
  }

  function goToThisWeek() {
    setManualWeekStart(null);
  }

  const profile = data?.profiles.find((p) => p.id === profileId);
  const days =
    data && effectiveWeekDates
      ? groupWeekForProfile(profileId, data.occurrences, data.chores, effectiveWeekDates, data.today)
      : [];

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 pb-28 sm:p-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[32px] font-extrabold">
          {profile ? `${profile.name}'s Week` : "Week"}
        </h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goToWeek(-1)}
            aria-label="Previous week"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-2"
          >
            <ChevronLeft />
          </button>
          <button
            type="button"
            onClick={goToThisWeek}
            className="h-14 rounded-full bg-surface-2 px-5 text-lg font-bold"
          >
            This week
          </button>
          <button
            type="button"
            onClick={() => goToWeek(1)}
            aria-label="Next week"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-2"
          >
            <ChevronRight />
          </button>
        </div>
      </header>

      {data && data.profiles.length > 1 && (
        <div className="flex gap-2">
          {data.profiles.map((p) => (
            <Link
              key={p.id}
              href={`/week/${p.id}?start=${effectiveWeekStart}`}
              className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl ${
                p.id === profileId ? "ring-[3px] ring-offset-2 ring-offset-bg" : ""
              }`}
              style={{
                backgroundColor: "white",
                boxShadow: p.id === profileId ? `0 0 0 3px ${p.color}` : undefined,
              }}
            >
              {p.emoji}
            </Link>
          ))}
        </div>
      )}

      {boardError ? (
        <ErrorState message="Couldn't load this week." onRetry={() => mutate()} />
      ) : !data ? (
        <BoardSkeleton columns={1} />
      ) : data.profiles.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
          <p className="text-lg text-text-muted">No one&apos;s set up yet.</p>
          <Link href="/manage/profiles" className="rounded-full bg-surface-2 px-5 py-3 text-lg font-bold">
            Add a profile
          </Link>
        </div>
      ) : !profile ? (
        <ErrorState message="That profile couldn't be found." />
      ) : (
        <ProfileColorScope hex={profile.color} className="flex flex-1 gap-3 overflow-x-auto snap-x pb-4">
          {days.map(({ date, rows }) => (
            <div
              key={date}
              className={`flex w-[220px] shrink-0 snap-start flex-col gap-2 rounded-column bg-[var(--profile-tint)] p-3 ${
                date === data.today ? "ring-2 ring-[var(--profile-base)]" : ""
              }`}
            >
              <div className="flex items-baseline gap-2 px-1">
                {(() => {
                  const { weekday, day } = formatDayLabel(date);
                  return (
                    <>
                      <span className="text-sm font-bold uppercase text-text-muted">{weekday}</span>
                      <span className="text-lg font-extrabold">{day}</span>
                    </>
                  );
                })()}
              </div>
              <div className="flex flex-col gap-2">
                {rows.map(({ chore, occurrence }) => (
                  <ChoreCard
                    key={`${chore.id}:${occurrence.occurrenceDate}`}
                    emoji={chore.emoji}
                    title={chore.title}
                    dueTime={chore.dueTime}
                    stars={chore.stars}
                    done={occurrence.status === "done"}
                    missed={occurrence.status === "missed"}
                    dismissed={occurrence.status === "dismissed"}
                    interactive={(occurrence.status === "due" || occurrence.status === "overdue") && online}
                    overdueLabel={
                      occurrence.status === "overdue" ? formatOverdueLabel(occurrence.occurrenceDate) : undefined
                    }
                    onToggle={() =>
                      handleToggle(
                        chore.id,
                        occurrence.occurrenceDate,
                        occurrence.status === "overdue" ? "overdue" : "due",
                      )
                    }
                    onDismiss={() => handleDismiss(chore.id, occurrence.occurrenceDate)}
                  />
                ))}
              </div>
            </div>
          ))}
        </ProfileColorScope>
      )}

      <TabBar weekHref={`/week/${profileId}`} />

      {mutationError ? (
        <Toast message={mutationError} />
      ) : (
        pendingUndo && <Toast message={pendingUndo.message} actionLabel="Undo" onAction={handleUndo} />
      )}
    </main>
  );
}
