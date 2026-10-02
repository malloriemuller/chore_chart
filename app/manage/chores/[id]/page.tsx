"use client";

import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { ChoreForm } from "@/components/ChoreForm";
import { apiFetch } from "@/lib/client/apiFetch";
import { fetcher } from "@/lib/client/fetcher";
import type { Chore, Profile } from "@/lib/domain/types";

export default function EditChorePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { data: choresData } = useSWR<{ chores: Chore[] }>("/api/manage/chores", fetcher);
  const { data: profilesData } = useSWR<{ profiles: Profile[] }>("/api/manage/profiles", fetcher);

  const chore = choresData?.chores.find((c) => c.id === id);
  const profiles = profilesData?.profiles ?? [];

  if (!chore || profiles.length === 0) {
    return <p className="text-text-muted">Loading…</p>;
  }

  return (
    <div className="max-w-xl">
      <h2 className="mb-4 text-[24px] font-extrabold">Edit chore</h2>
      <ChoreForm
        profiles={profiles}
        initial={chore}
        onSubmit={async (values) => {
          await apiFetch(`/api/manage/chores/${chore.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(values),
          });
          router.push("/manage/chores");
        }}
        onCancel={() => router.push("/manage/chores")}
      />
    </div>
  );
}
