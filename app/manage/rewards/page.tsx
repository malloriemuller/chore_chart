"use client";

import { Archive, Pencil, Plus } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";
import { ErrorState } from "@/components/ErrorState";
import { RewardForm } from "@/components/RewardForm";
import { apiFetch } from "@/lib/client/apiFetch";
import { fetcher } from "@/lib/client/fetcher";
import type { Profile, Reward } from "@/lib/domain/types";

export default function RewardsManagePage() {
  const { data: rewardsData, error, mutate } = useSWR<{ rewards: Reward[] }>("/api/manage/rewards", fetcher);
  const { data: profilesData } = useSWR<{ profiles: Profile[] }>("/api/manage/profiles", fetcher);
  const [editing, setEditing] = useState<Reward | "new" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const profiles = (profilesData?.profiles ?? []).filter((p) => p.role === "child");
  const rewards = rewardsData?.rewards ?? [];
  const profileName = (id?: string) => (id ? profiles.find((p) => p.id === id)?.name ?? "—" : "All children");

  async function toggleArchived(reward: Reward) {
    setActionError(null);
    try {
      await apiFetch(`/api/manage/rewards/${reward.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: !reward.archived }),
      });
      await mutate();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Couldn't update that reward.");
    }
  }

  if (error) return <ErrorState message="Couldn't load rewards." onRetry={() => mutate()} />;
  if (!rewardsData) return <p className="text-text-muted">Loading…</p>;

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[24px] font-extrabold">Rewards</h2>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="flex h-12 items-center gap-2 rounded-full bg-text px-4 font-bold text-bg"
        >
          <Plus size={18} /> Add
        </button>
      </div>

      {editing === "new" && (
        <RewardForm
          profiles={profiles}
          onSubmit={async (values) => {
            await apiFetch("/api/manage/rewards", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...values, archived: false }),
            });
            setEditing(null);
            await mutate();
          }}
          onCancel={() => setEditing(null)}
        />
      )}

      {actionError && <p className="text-base font-semibold text-danger">{actionError}</p>}

      {rewards.length === 0 && <p className="text-text-muted">No rewards yet. Add one above.</p>}

      {rewards.map((reward) => (
        <div key={reward.id} className="flex flex-col gap-2">
          <div
            className={`flex items-center gap-3 rounded-card bg-surface p-3 shadow-card ${reward.archived ? "opacity-50" : ""}`}
          >
            {reward.emoji && <span className="text-2xl">{reward.emoji}</span>}
            <div className="flex-1">
              <p className="text-lg font-bold">{reward.name}</p>
              <p className="text-sm text-text-muted">
                {reward.cost}★ · {profileName(reward.profileId)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditing(reward)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2"
              aria-label="Edit"
            >
              <Pencil size={16} />
            </button>
            <button
              type="button"
              onClick={() => toggleArchived(reward)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2"
              aria-label={reward.archived ? "Unarchive" : "Archive"}
            >
              <Archive size={16} />
            </button>
          </div>

          {editing !== "new" && editing?.id === reward.id && (
            <RewardForm
              profiles={profiles}
              initial={reward}
              onSubmit={async (values) => {
                await apiFetch(`/api/manage/rewards/${reward.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(values),
                });
                setEditing(null);
                await mutate();
              }}
              onCancel={() => setEditing(null)}
            />
          )}
        </div>
      ))}
    </div>
  );
}
