"use client";

import { ArrowDown, ArrowUp, Pencil, Plus } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";
import { ErrorState } from "@/components/ErrorState";
import { ProfileForm } from "@/components/ProfileForm";
import { apiFetch } from "@/lib/client/apiFetch";
import { fetcher } from "@/lib/client/fetcher";
import type { Profile } from "@/lib/domain/types";

export default function ProfilesPage() {
  const { data, error, mutate } = useSWR<{ profiles: Profile[] }>("/api/manage/profiles", fetcher);
  const [editing, setEditing] = useState<Profile | "new" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function patch(id: string, body: Partial<Profile>) {
    await apiFetch(`/api/manage/profiles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await mutate();
  }

  async function swap(a: Profile, b: Profile) {
    setActionError(null);
    try {
      await Promise.all([patch(a.id, { sortOrder: b.sortOrder }), patch(b.id, { sortOrder: a.sortOrder })]);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Couldn't reorder profiles.");
    }
  }

  async function toggleActive(profile: Profile, active: boolean) {
    setActionError(null);
    try {
      await patch(profile.id, { active });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Couldn't update that profile.");
    }
  }

  const profiles = [...(data?.profiles ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);

  if (error) return <ErrorState message="Couldn't load profiles." onRetry={() => mutate()} />;
  if (!data) return <p className="text-text-muted">Loading…</p>;

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[24px] font-extrabold">Profiles</h2>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="flex h-12 items-center gap-2 rounded-full bg-text px-4 font-bold text-bg"
        >
          <Plus size={18} /> Add
        </button>
      </div>

      {editing === "new" && (
        <ProfileForm
          onSubmit={async (input) => {
            const sortOrder = profiles.length > 0 ? Math.max(...profiles.map((p) => p.sortOrder)) + 1 : 0;
            await apiFetch("/api/manage/profiles", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...input, sortOrder, active: true }),
            });
            setEditing(null);
            await mutate();
          }}
          onCancel={() => setEditing(null)}
        />
      )}

      {actionError && <p className="text-base font-semibold text-danger">{actionError}</p>}

      {profiles.length === 0 && <p className="text-text-muted">No profiles yet. Add one above.</p>}

      {profiles.map((profile, i) => (
        <div key={profile.id} className="flex flex-col gap-2">
          <div className="flex items-center gap-3 rounded-card bg-surface p-3 shadow-card">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-full text-2xl"
              style={{ backgroundColor: profile.color }}
            >
              {profile.emoji}
            </span>
            <div className="flex-1">
              <p className="text-lg font-bold">{profile.name}</p>
              <p className="text-sm capitalize text-text-muted">{profile.role}</p>
            </div>
            <button
              type="button"
              disabled={i === 0}
              onClick={() => swap(profile, profiles[i - 1])}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 disabled:opacity-30"
              aria-label="Move up"
            >
              <ArrowUp size={16} />
            </button>
            <button
              type="button"
              disabled={i === profiles.length - 1}
              onClick={() => swap(profile, profiles[i + 1])}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 disabled:opacity-30"
              aria-label="Move down"
            >
              <ArrowDown size={16} />
            </button>
            <button
              type="button"
              onClick={() => setEditing(profile)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2"
              aria-label="Edit"
            >
              <Pencil size={16} />
            </button>
            <label className="flex items-center gap-2 text-sm text-text-muted">
              Active
              <input
                type="checkbox"
                checked={profile.active}
                onChange={(e) => toggleActive(profile, e.target.checked)}
                className="h-5 w-5"
              />
            </label>
          </div>

          {editing !== "new" && editing?.id === profile.id && (
            <ProfileForm
              initial={profile}
              onSubmit={async (input) => {
                await patch(profile.id, input);
                setEditing(null);
              }}
              onCancel={() => setEditing(null)}
            />
          )}
        </div>
      ))}
    </div>
  );
}
