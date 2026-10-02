"use client";

import { useState } from "react";
import { PROFILE_COLOR_PRESETS } from "@/lib/design/profileColor";
import type { Profile, Role } from "@/lib/domain/types";

export function ProfileForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<Profile>;
  onSubmit: (input: Omit<Profile, "id" | "sortOrder" | "active"> & { active?: boolean }) => Promise<void>;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [role, setRole] = useState<Role>(initial?.role ?? "child");
  const [color, setColor] = useState(initial?.color ?? PROFILE_COLOR_PRESETS[0].hex);
  const [emoji, setEmoji] = useState(initial?.emoji ?? "🙂");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    setSaving(true);
    try {
      await onSubmit({ name: name.trim(), role, color, emoji, active: initial?.active ?? true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save that profile.");
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
          className="h-14 w-14 rounded-card bg-surface-2 text-center text-2xl"
          aria-label="Emoji"
          maxLength={4}
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="h-14 flex-1 rounded-card bg-surface-2 px-4 text-lg"
          required
        />
      </div>

      <div className="flex gap-2">
        {(["parent", "child"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`h-12 flex-1 rounded-full text-base font-bold capitalize ${
              role === r ? "bg-text text-bg" : "bg-surface-2 text-text-muted"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {PROFILE_COLOR_PRESETS.map((preset) => (
          <button
            key={preset.hex}
            type="button"
            aria-label={preset.name}
            onClick={() => setColor(preset.hex)}
            className="h-10 w-10 rounded-full"
            style={{
              backgroundColor: preset.hex,
              boxShadow: color === preset.hex ? "0 0 0 3px var(--text)" : undefined,
            }}
          />
        ))}
        <input
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-10 w-28 rounded-full bg-surface-2 px-3 text-sm"
          aria-label="Custom hex color"
        />
      </div>

      {error && <p className="text-base font-semibold text-danger">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="h-14 flex-1 rounded-full bg-[var(--profile-base,var(--text))] px-5 text-lg font-bold text-white disabled:opacity-50"
          style={{ backgroundColor: color }}
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
