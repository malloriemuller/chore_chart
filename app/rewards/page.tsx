"use client";

import { useState } from "react";
import useSWR from "swr";
import { BoardSkeleton } from "@/components/BoardSkeleton";
import { ColumnHeader } from "@/components/ColumnHeader";
import { ErrorState } from "@/components/ErrorState";
import { ProfileColorScope } from "@/components/ProfileColorScope";
import { RedeemModal } from "@/components/RedeemModal";
import { RewardCard } from "@/components/RewardCard";
import { TabBar } from "@/components/TabBar";
import { fetcher } from "@/lib/client/fetcher";
import { parseLocalDate } from "@/lib/domain/dates";
import type { RewardsResponse } from "@/lib/server/rewards";

const POLL_INTERVAL_MS = 15_000;

function formatRedeemedDate(date: string): string {
  return parseLocalDate(date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function RewardsPage() {
  const { data, error, mutate } = useSWR<RewardsResponse>("/api/rewards", fetcher, {
    refreshInterval: POLL_INTERVAL_MS,
    revalidateOnFocus: true,
  });
  const [redeemTarget, setRedeemTarget] = useState<{ rewardId: string; rewardName: string; profileId: string; profileName: string } | null>(
    null,
  );

  return (
    <main className="flex flex-1 flex-col gap-10 p-4 pb-28 sm:p-8">
      <h1 className="text-[32px] font-extrabold">Rewards</h1>

      {error ? (
        <ErrorState message="Couldn't load rewards." onRetry={() => mutate()} />
      ) : !data ? (
        <BoardSkeleton columns={2} />
      ) : (
        <>
          {data.children.length === 0 && <p className="text-text-muted">No children set up yet.</p>}
          {data.children.map((child) => {
            const visibleRewards = data.rewards.filter((r) => !r.profileId || r.profileId === child.id);
            const balance = data.balances[child.id] ?? 0;

            return (
              <ProfileColorScope key={child.id} hex={child.color} className="flex flex-col gap-4">
                <ColumnHeader emoji={child.emoji} name={child.name} balance={balance} />
                {visibleRewards.length === 0 ? (
                  <p className="text-text-muted">No rewards set up yet.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {visibleRewards.map((reward) => (
                      <RewardCard
                        key={reward.id}
                        emoji={reward.emoji}
                        name={reward.name}
                        cost={reward.cost}
                        balance={balance}
                        onRedeem={() =>
                          setRedeemTarget({
                            rewardId: reward.id,
                            rewardName: reward.name,
                            profileId: child.id,
                            profileName: child.name,
                          })
                        }
                      />
                    ))}
                  </div>
                )}
              </ProfileColorScope>
            );
          })}

          <section className="flex flex-col gap-3">
            <h2 className="text-[24px] font-extrabold">Recent redemptions</h2>
            {data.recentRedemptions.length === 0 ? (
              <p className="text-text-muted">No redemptions yet.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {data.recentRedemptions.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between rounded-card bg-surface p-3 shadow-card border border-[color:var(--card-border-color)]"
                  >
                    <span className="text-base font-semibold">{r.label}</span>
                    <span className="text-sm text-text-muted">{formatRedeemedDate(r.redeemedDate)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <TabBar weekHref={data?.children[0] ? `/week/${data.children[0].id}` : "/manage"} />

      {redeemTarget && (
        <RedeemModal
          rewardId={redeemTarget.rewardId}
          rewardName={redeemTarget.rewardName}
          profileId={redeemTarget.profileId}
          profileName={redeemTarget.profileName}
          onClose={() => setRedeemTarget(null)}
          onRedeemed={() => {
            setRedeemTarget(null);
            void mutate();
          }}
        />
      )}
    </main>
  );
}
