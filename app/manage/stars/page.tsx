"use client";

import { useState } from "react";
import useSWR from "swr";
import { ErrorState } from "@/components/ErrorState";
import { fetcher } from "@/lib/client/fetcher";
import { parseLocalDate } from "@/lib/domain/dates";
import { computeBalance } from "@/lib/domain/stars";
import type { Chore, Completion, Profile, Redemption } from "@/lib/domain/types";

interface LedgerRow {
  date: string;
  description: string;
  delta: number;
}

function formatDate(date: string): string {
  return parseLocalDate(date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function StarsPage() {
  const { data: profilesData, error, mutate } = useSWR<{ profiles: Profile[] }>("/api/manage/profiles", fetcher);
  const { data: choresData } = useSWR<{ chores: Chore[] }>("/api/manage/chores", fetcher);
  const profiles = (profilesData?.profiles ?? []).filter((p) => p.active);
  const [profileId, setProfileId] = useState<string | null>(null);
  const activeProfileId = profileId ?? profiles[0]?.id ?? null;

  const { data } = useSWR<{ completions: Completion[]; redemptions: Redemption[] }>(
    activeProfileId ? `/api/manage/stars/${activeProfileId}` : null,
    fetcher,
  );

  const choreTitle = (id: string) => choresData?.chores.find((c) => c.id === id)?.title ?? "Chore";

  const ledger: LedgerRow[] = data
    ? [
        ...data.completions.map((c) => ({
          date: c.completedDate,
          description: `✅ ${choreTitle(c.choreId)}`,
          delta: c.starsAwarded,
        })),
        ...data.redemptions.map((r) => ({ date: r.redeemedDate, description: `🎁 ${r.label}`, delta: -r.cost })),
      ].sort((a, b) => b.date.localeCompare(a.date))
    : [];

  const balance = data ? computeBalance(activeProfileId ?? "", data.completions, data.redemptions) : 0;

  if (error) return <ErrorState message="Couldn't load profiles." onRetry={() => mutate()} />;
  if (!profilesData) return <p className="text-text-muted">Loading…</p>;

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <h2 className="text-[24px] font-extrabold">Stars</h2>

      {profiles.length === 0 && <p className="text-text-muted">No profiles yet.</p>}

      <div className="flex gap-2">
        {profiles.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setProfileId(p.id)}
            className={`h-12 rounded-full px-4 text-base font-bold ${
              p.id === activeProfileId ? "bg-text text-bg" : "bg-surface-2 text-text-muted"
            }`}
          >
            {p.emoji} {p.name}
          </button>
        ))}
      </div>

      {activeProfileId && (
        <>
          <p className="text-lg">
            Balance: <span className="font-extrabold text-star">{balance}★</span>
          </p>

          <div className="flex flex-col gap-2">
            {ledger.length === 0 && <p className="text-text-muted">No activity yet.</p>}
            {ledger.map((row, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-card bg-surface p-3 shadow-card border border-[color:var(--card-border-color)]"
              >
                <span className="text-base font-semibold">{row.description}</span>
                <span className="flex items-center gap-3">
                  <span className="text-sm text-text-muted">{formatDate(row.date)}</span>
                  <span className={`font-bold ${row.delta >= 0 ? "text-success" : "text-danger"}`}>
                    {row.delta >= 0 ? "+" : ""}
                    {row.delta}★
                  </span>
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
