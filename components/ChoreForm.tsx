"use client";

import { useMemo, useState } from "react";
import { getNextOccurrences } from "@/lib/domain/occurrences";
import type { Chore, DayOfWeek, Frequency, Profile, RepeatMode, TimeOfDay } from "@/lib/domain/types";

const DAYS: DayOfWeek[] = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

export type ChoreFormValues = Omit<Chore, "id" | "archived" | "nextDueDate">;

export function ChoreForm({
  profiles,
  initial,
  onSubmit,
  onCancel,
}: {
  profiles: Profile[];
  initial?: Partial<ChoreFormValues>;
  onSubmit: (values: ChoreFormValues) => Promise<void>;
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [emoji, setEmoji] = useState(initial?.emoji ?? "");
  const [assigneeId, setAssigneeId] = useState(initial?.assigneeId ?? profiles[0]?.id ?? "");
  const [stars, setStars] = useState(initial?.stars ?? 1);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(initial?.timeOfDay ?? "anytime");
  const [dueTime, setDueTime] = useState(initial?.dueTime ?? "");
  const [repeatMode, setRepeatMode] = useState<RepeatMode>(initial?.repeatMode ?? "none");
  const [startDate, setStartDate] = useState(initial?.startDate ?? "");
  const [frequency, setFrequency] = useState<Frequency>(initial?.frequency ?? "daily");
  const [interval, setIntervalValue] = useState(initial?.interval ?? 1);
  const [daysOfWeek, setDaysOfWeek] = useState<DayOfWeek[]>(initial?.daysOfWeek ?? []);
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const [delayDays, setDelayDays] = useState(initial?.delayDays ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function toggleDay(day: DayOfWeek) {
    setDaysOfWeek((days) => (days.includes(day) ? days.filter((d) => d !== day) : [...days, day]));
  }

  const preview = useMemo(() => {
    if (!startDate) return [];
    const draft: Chore = {
      id: "preview",
      title: title || "Preview",
      assigneeId,
      stars,
      timeOfDay,
      repeatMode,
      startDate,
      frequency: repeatMode === "schedule" ? frequency : undefined,
      interval: repeatMode === "schedule" ? interval : undefined,
      daysOfWeek: repeatMode === "schedule" && frequency === "weekly" ? daysOfWeek : undefined,
      endDate: repeatMode === "schedule" && endDate ? endDate : undefined,
      delayDays: repeatMode === "after_completion" ? delayDays : undefined,
      nextDueDate: repeatMode === "after_completion" ? startDate : undefined,
      archived: false,
    };
    try {
      return getNextOccurrences(draft, startDate, 5);
    } catch {
      return [];
    }
  }, [title, assigneeId, stars, timeOfDay, repeatMode, startDate, frequency, interval, daysOfWeek, endDate, delayDays]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (repeatMode === "schedule") {
      if (interval < 1) return setError("Interval must be at least 1.");
      if (endDate && endDate < startDate) return setError("EndDate must be on or after StartDate.");
    }

    setSaving(true);
    try {
      await onSubmit({
        title,
        emoji: emoji || undefined,
        assigneeId,
        stars,
        timeOfDay,
        dueTime: dueTime || undefined,
        repeatMode,
        startDate,
        frequency: repeatMode === "schedule" ? frequency : undefined,
        interval: repeatMode === "schedule" ? interval : undefined,
        daysOfWeek: repeatMode === "schedule" && frequency === "weekly" ? daysOfWeek : undefined,
        endDate: repeatMode === "schedule" && endDate ? endDate : undefined,
        delayDays: repeatMode === "after_completion" ? delayDays : undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save that chore.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-card bg-surface p-4 shadow-card">
      <div className="flex gap-3">
        <input
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          placeholder="🧹"
          maxLength={4}
          className="h-14 w-14 rounded-card bg-surface-2 text-center text-2xl"
          aria-label="Emoji"
        />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Chore title"
          required
          className="h-14 flex-1 rounded-card bg-surface-2 px-4 text-lg"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <select
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
          className="h-12 rounded-card bg-surface-2 px-3"
        >
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.emoji} {p.name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-base">
          Stars
          <input
            type="number"
            min={0}
            value={stars}
            onChange={(e) => setStars(Number(e.target.value))}
            className="h-12 w-20 rounded-card bg-surface-2 px-3"
          />
        </label>
        <select
          value={timeOfDay}
          onChange={(e) => setTimeOfDay(e.target.value as TimeOfDay)}
          className="h-12 rounded-card bg-surface-2 px-3"
        >
          <option value="morning">Morning</option>
          <option value="afternoon">Afternoon</option>
          <option value="evening">Evening</option>
          <option value="anytime">Anytime</option>
        </select>
        <input
          value={dueTime}
          onChange={(e) => setDueTime(e.target.value)}
          placeholder="HH:mm (optional)"
          className="h-12 rounded-card bg-surface-2 px-3"
        />
      </div>

      <div className="flex gap-2">
        {(["none", "schedule", "after_completion"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setRepeatMode(mode)}
            className={`h-12 flex-1 rounded-full text-sm font-bold ${
              repeatMode === mode ? "bg-text text-bg" : "bg-surface-2 text-text-muted"
            }`}
          >
            {mode === "none" ? "One-time" : mode === "schedule" ? "Fixed schedule" : "After completion"}
          </button>
        ))}
      </div>

      <label className="flex items-center gap-3 text-base">
        {repeatMode === "schedule" ? "Starts on" : repeatMode === "after_completion" ? "First due" : "Due date"}
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
          className="h-12 flex-1 rounded-card bg-surface-2 px-3"
        />
      </label>

      {repeatMode === "schedule" && (
        <div className="flex flex-col gap-3 rounded-card bg-surface-2 p-3">
          <div className="grid grid-cols-2 gap-3">
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as Frequency)}
              className="h-12 rounded-card bg-surface px-3"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <label className="flex items-center gap-2">
              Every
              <input
                type="number"
                min={1}
                value={interval}
                onChange={(e) => setIntervalValue(Number(e.target.value))}
                className="h-12 w-16 rounded-card bg-surface px-3"
              />
              {frequency === "daily" ? "day(s)" : frequency === "weekly" ? "week(s)" : "month(s)"}
            </label>
          </div>

          {frequency === "weekly" && (
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`h-10 w-10 rounded-full text-sm font-bold ${
                    daysOfWeek.includes(day) ? "bg-text text-bg" : "bg-surface text-text-muted"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          )}

          <label className="flex items-center gap-3">
            Ends on (optional)
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-12 flex-1 rounded-card bg-surface px-3"
            />
          </label>
        </div>
      )}

      {repeatMode === "after_completion" && (
        <label className="flex items-center gap-3 rounded-card bg-surface-2 p-3">
          Due again
          <input
            type="number"
            min={0}
            value={delayDays}
            onChange={(e) => setDelayDays(Number(e.target.value))}
            className="h-12 w-20 rounded-card bg-surface px-3"
          />
          day(s) after it&rsquo;s checked off (0 = same day)
        </label>
      )}

      {repeatMode === "schedule" && preview.length > 0 && (
        <div className="rounded-card bg-surface-2 p-3 text-sm">
          <p className="mb-1 font-bold text-text-muted">Next 5 due dates</p>
          <p>{preview.join(" · ")}</p>
        </div>
      )}

      {error && <p className="text-base font-semibold text-danger">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving || profiles.length === 0}
          className="h-14 flex-1 rounded-full bg-text px-5 text-lg font-bold text-bg disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="h-14 rounded-full bg-surface-2 px-5 text-lg font-bold">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
