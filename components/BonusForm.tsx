"use client";

import { Minus, Plus } from "lucide-react";
import { useState } from "react";

const MAX_STARS = 50;

export interface BonusFormValues {
  label: string;
  stars: number;
}

/**
 * Stars for something that isn't a chore. Negative amounts are reached with the minus button,
 * which is how a mistake gets corrected without editing Airtable by hand.
 */
export function BonusForm({
  profileName,
  onSubmit,
}: {
  profileName: string;
  onSubmit: (values: BonusFormValues) => Promise<void>;
}) {
  const [stars, setStars] = useState(1);
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = stars !== 0 && label.trim().length > 0;

  function step(by: number) {
    setStars((current) => Math.min(MAX_STARS, Math.max(-MAX_STARS, current + by)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || saving) return;
    setError(null);
    setSaving(true);
    try {
      await onSubmit({ label: label.trim(), stars });
      setLabel("");
      setStars(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't give those stars.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-card bg-surface p-4 shadow-card">
      <h3 className="text-lg font-extrabold">Give {profileName} stars</h3>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label="One star fewer"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-2"
        >
          <Minus aria-hidden />
        </button>
        <span className="w-20 text-center text-[28px] font-extrabold" aria-live="polite">
          {stars > 0 ? "+" : ""}
          {stars}★
        </span>
        <button
          type="button"
          onClick={() => step(1)}
          aria-label="One star more"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-2"
        >
          <Plus aria-hidden />
        </button>

        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="What for? e.g. Nice to her brother"
          maxLength={80}
          aria-label="Reason"
          className="h-12 min-w-0 flex-1 rounded-card bg-surface-2 px-4 text-base"
        />
      </div>

      {error && <p className="text-base font-semibold text-danger">{error}</p>}

      <button
        type="submit"
        disabled={!ready || saving}
        className="h-14 rounded-full bg-text px-5 text-lg font-bold text-bg disabled:opacity-50"
      >
        {saving ? "Saving…" : stars < 0 ? "Take stars away" : "Give stars"}
      </button>
    </form>
  );
}
