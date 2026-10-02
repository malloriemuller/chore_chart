"use client";

import { useState } from "react";
import type { Profile, Reward } from "@/lib/domain/types";

export type RewardFormValues = Omit<Reward, "id" | "archived">;

export function RewardForm({
  profiles,
  initial,
  onSubmit,
  onCancel,
}: {
  profiles: Profile[];
  initial?: Partial<RewardFormValues>;
  onSubmit: (values: RewardFormValues) => Promise<void>;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [emoji, setEmoji] = useState(initial?.emoji ?? "");
  const [cost, setCost] = useState(initial?.cost ?? 10);
  const [profileId, setProfileId] = useState(initial?.profileId ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    setSaving(true);
    try {
      await onSubmit({ name: name.trim(), emoji: emoji || undefined, cost, profileId: profileId || undefined });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save that reward.");
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
          placeholder="🎬"
          maxLength={4}
          className="h-14 w-14 rounded-card bg-surface-2 text-center text-2xl"
          aria-label="Emoji"
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Reward name"
          required
          className="h-14 flex-1 rounded-card bg-surface-2 px-4 text-lg"
        />
      </div>

      <label className="flex items-center gap-3">
        Cost
        <input
          type="number"
          min={1}
          value={cost}
          onChange={(e) => setCost(Number(e.target.value))}
          className="h-12 w-24 rounded-card bg-surface-2 px-3"
        />
        stars
      </label>

      <label className="flex items-center gap-3">
        Available to
        <select
          value={profileId}
          onChange={(e) => setProfileId(e.target.value)}
          className="h-12 flex-1 rounded-card bg-surface-2 px-3"
        >
          <option value="">All children</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      {error && <p className="text-base font-semibold text-danger">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
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
