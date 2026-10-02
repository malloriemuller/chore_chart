"use client";

import { Archive, Copy, Pencil, Plus, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import type { ChoreFormValues } from "@/components/ChoreForm";
import { ErrorState } from "@/components/ErrorState";
import { CHORE_PRESETS, type ChorePreset } from "@/lib/chorePresets";
import { apiFetch } from "@/lib/client/apiFetch";
import { fetcher } from "@/lib/client/fetcher";
import type { Chore, DayOfWeek, Profile, RepeatMode, TimeOfDay } from "@/lib/domain/types";
import { useClientGuessDate } from "@/lib/hooks/useClientGuessDate";

type RepeatChoice = "daily" | "weekdays" | "weekly" | "once";

const REPEAT_CHOICES: { value: RepeatChoice; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekdays", label: "Weekdays" },
  { value: "weekly", label: "Weekly" },
  { value: "once", label: "Once" },
];

const WEEKDAYS: DayOfWeek[] = ["MO", "TU", "WE", "TH", "FR"];

type RepeatFields = Pick<
  ChoreFormValues,
  "repeatMode" | "startDate" | "frequency" | "interval" | "daysOfWeek"
>;

/** Maps a quick-add repeat chip onto the chore fields the domain layer expects. */
function repeatFields(choice: RepeatChoice, startDate: string): RepeatFields {
  switch (choice) {
    case "once":
      return { repeatMode: "none", startDate };
    case "weekdays":
      return { repeatMode: "schedule", startDate, frequency: "weekly", interval: 1, daysOfWeek: WEEKDAYS };
    case "weekly":
      // No daysOfWeek: the domain falls back to the weekday of startDate.
      return { repeatMode: "schedule", startDate, frequency: "weekly", interval: 1 };
    case "daily":
    default:
      return { repeatMode: "schedule", startDate, frequency: "daily", interval: 1 };
  }
}

function repeatSummary(chore: Chore): string {
  if (chore.repeatMode === "none") return `Once, ${chore.startDate}`;
  if (chore.repeatMode === "after_completion") return `Again ${chore.delayDays ?? 0}d after done`;
  if (chore.frequency === "weekly" && chore.daysOfWeek?.length) {
    return chore.daysOfWeek.join(" ");
  }
  const unit = chore.frequency === "daily" ? "day" : chore.frequency === "weekly" ? "week" : "month";
  return `Every ${chore.interval ?? 1} ${unit}(s)`;
}

export default function ChoresPage() {
  const { data: choresData, error, mutate } = useSWR<{ chores: Chore[] }>("/api/manage/chores", fetcher);
  const { data: profilesData } = useSWR<{ profiles: Profile[] }>("/api/manage/profiles", fetcher);
  const today = useClientGuessDate();

  const [selectedRaw, setSelectedRaw] = useState<string | null>(null);
  const [repeatFilter, setRepeatFilter] = useState<"all" | RepeatMode>("all");
  const [repeatChoice, setRepeatChoice] = useState<RepeatChoice>("daily");
  const [title, setTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const profiles = (profilesData?.profiles ?? []).filter((p) => p.active);
  const profileName = (id: string) => profiles.find((p) => p.id === id)?.name ?? "—";

  // "all" is an explicit choice; before any tap we default to the first kid.
  const selected = selectedRaw ?? profiles[0]?.id ?? "all";
  const targetProfile = selected === "all" ? null : profiles.find((p) => p.id === selected);

  const allChores = choresData?.chores ?? [];
  const chores = allChores.filter(
    (c) =>
      (selected === "all" || c.assigneeId === selected) &&
      (repeatFilter === "all" || c.repeatMode === repeatFilter),
  );

  const existingTitles = new Set(
    allChores.filter((c) => c.assigneeId === selected && !c.archived).map((c) => c.title.toLowerCase()),
  );
  const availablePresets = CHORE_PRESETS.filter((p) => !existingTitles.has(p.title.toLowerCase()));

  async function createChore(input: { title: string; emoji?: string; stars?: number; timeOfDay?: TimeOfDay }) {
    if (!targetProfile || !today) return;
    setActionError(null);
    setAdding(true);
    try {
      const body: ChoreFormValues = {
        title: input.title,
        emoji: input.emoji,
        assigneeId: targetProfile.id,
        stars: input.stars ?? 1,
        timeOfDay: input.timeOfDay ?? "anytime",
        ...repeatFields(repeatChoice, today),
      };

      await apiFetch("/api/manage/chores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      await mutate();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Couldn't add that chore.");
    } finally {
      setAdding(false);
    }
  }

  async function submitQuickAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    setTitle("");
    await createChore({ title: trimmed });
  }

  async function addPreset(preset: ChorePreset) {
    await createChore(preset);
  }

  async function duplicate(chore: Chore) {
    const body: ChoreFormValues = {
      title: `${chore.title} (copy)`,
      emoji: chore.emoji,
      assigneeId: chore.assigneeId,
      stars: chore.stars,
      timeOfDay: chore.timeOfDay,
      dueTime: chore.dueTime,
      repeatMode: chore.repeatMode,
      startDate: chore.startDate,
      frequency: chore.frequency,
      interval: chore.interval,
      daysOfWeek: chore.daysOfWeek,
      endDate: chore.endDate,
      delayDays: chore.delayDays,
    };
    setActionError(null);
    try {
      await apiFetch("/api/manage/chores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      await mutate();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Couldn't duplicate that chore.");
    }
  }

  async function toggleArchived(chore: Chore) {
    setActionError(null);
    try {
      await apiFetch(`/api/manage/chores/${chore.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: !chore.archived }),
      });
      await mutate();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Couldn't update that chore.");
    }
  }

  if (error) return <ErrorState message="Couldn't load chores." onRetry={() => mutate()} />;
  if (!choresData) return <p className="text-text-muted">Loading…</p>;

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[24px] font-extrabold">Chores</h2>
        <Link
          href="/manage/chores/new"
          className="flex h-12 items-center gap-2 rounded-full bg-surface-2 px-4 font-bold text-text-muted"
        >
          <SlidersHorizontal size={16} /> Full form
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {profiles.map((p) => {
          const active = p.id === selected;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedRaw(p.id)}
              className={`flex h-12 items-center gap-2 rounded-full px-4 text-base font-bold ${
                active ? "text-white" : "bg-surface-2 text-text-muted"
              }`}
              style={active ? { backgroundColor: p.color } : undefined}
            >
              <span className="text-xl">{p.emoji}</span>
              {p.name}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setSelectedRaw("all")}
          className={`h-12 rounded-full px-4 text-base font-bold ${
            selected === "all" ? "bg-text text-bg" : "bg-surface-2 text-text-muted"
          }`}
        >
          Everyone
        </button>
      </div>

      {actionError && <p className="text-base font-semibold text-danger">{actionError}</p>}

      {targetProfile ? (
        <div className="flex flex-col gap-3 rounded-card bg-surface p-4 shadow-card">
          <form onSubmit={submitQuickAdd} className="flex gap-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`Add a chore for ${targetProfile.name}…`}
              className="h-14 flex-1 rounded-card bg-surface-2 px-4 text-lg"
            />
            <button
              type="submit"
              disabled={!title.trim() || !today || adding}
              className="flex h-14 items-center gap-2 rounded-full bg-text px-5 text-lg font-bold text-bg disabled:opacity-40"
            >
              <Plus size={18} /> Add
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold uppercase tracking-[0.06em] text-text-muted">Repeats</span>
            {REPEAT_CHOICES.map((choice) => (
              <button
                key={choice.value}
                type="button"
                onClick={() => setRepeatChoice(choice.value)}
                className={`h-10 rounded-full px-4 text-sm font-bold ${
                  repeatChoice === choice.value ? "bg-text text-bg" : "bg-surface-2 text-text-muted"
                }`}
              >
                {choice.label}
              </button>
            ))}
          </div>

          {availablePresets.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-line pt-3">
              <span className="text-sm font-bold uppercase tracking-[0.06em] text-text-muted">
                Common chores
              </span>
              <div className="flex flex-wrap gap-2">
                {availablePresets.map((preset) => (
                  <button
                    key={preset.title}
                    type="button"
                    disabled={adding || !today}
                    onClick={() => addPreset(preset)}
                    className="flex h-10 items-center gap-2 rounded-full bg-surface-2 px-3 text-sm font-bold text-text disabled:opacity-40"
                  >
                    <span className="text-base">{preset.emoji}</span>
                    {preset.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-text-muted">Pick a kid above to add chores.</p>
      )}

      <div className="flex items-center gap-3">
        <select
          value={repeatFilter}
          onChange={(e) => setRepeatFilter(e.target.value as "all" | RepeatMode)}
          className="h-10 rounded-full bg-surface-2 px-3 text-sm"
        >
          <option value="all">Any repeat mode</option>
          <option value="none">One-time</option>
          <option value="schedule">Fixed schedule</option>
          <option value="after_completion">After completion</option>
        </select>
        <span className="text-sm text-text-muted">
          {chores.length} chore{chores.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {chores.map((chore) => (
          <div
            key={chore.id}
            className={`flex items-center gap-3 rounded-card bg-surface p-3 shadow-card ${chore.archived ? "opacity-50" : ""}`}
          >
            {chore.emoji && <span className="text-2xl">{chore.emoji}</span>}
            <div className="min-w-0 flex-1">
              <p className="text-lg font-bold">{chore.title}</p>
              <p className="text-sm text-text-muted">
                {selected === "all" ? `${profileName(chore.assigneeId)} · ` : ""}
                {repeatSummary(chore)} · {chore.stars}★
              </p>
            </div>
            <Link
              href={`/manage/chores/${chore.id}`}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2"
              aria-label="Edit"
            >
              <Pencil size={16} />
            </Link>
            <button
              type="button"
              onClick={() => duplicate(chore)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2"
              aria-label="Duplicate"
            >
              <Copy size={16} />
            </button>
            <button
              type="button"
              onClick={() => toggleArchived(chore)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2"
              aria-label={chore.archived ? "Unarchive" : "Archive"}
            >
              <Archive size={16} />
            </button>
          </div>
        ))}
        {chores.length === 0 && (
          <p className="text-text-muted">
            {targetProfile ? `No chores for ${targetProfile.name} yet.` : "No chores match these filters."}
          </p>
        )}
      </div>
    </div>
  );
}
