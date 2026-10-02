"use client";

import { useRouter } from "next/navigation";
import useSWR from "swr";
import { ChoreForm } from "@/components/ChoreForm";
import { apiFetch } from "@/lib/client/apiFetch";
import { fetcher } from "@/lib/client/fetcher";
import type { Profile } from "@/lib/domain/types";

export default function NewChorePage() {
  const router = useRouter();
  const { data } = useSWR<{ profiles: Profile[] }>("/api/manage/profiles", fetcher);
  const profiles = (data?.profiles ?? []).filter((p) => p.active);

  return (
    <div className="max-w-xl">
      <h2 className="mb-4 text-[24px] font-extrabold">New chore</h2>
      {!data ? (
        <p className="text-text-muted">Loading…</p>
      ) : profiles.length === 0 ? (
        <p className="text-text-muted">Add a profile first.</p>
      ) : (
        <ChoreForm
          profiles={profiles}
          onSubmit={async (values) => {
            await apiFetch("/api/manage/chores", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(values),
            });
            router.push("/manage/chores");
          }}
          onCancel={() => router.push("/manage/chores")}
        />
      )}
    </div>
  );
}
