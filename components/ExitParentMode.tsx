"use client";

import { useRouter } from "next/navigation";

export function ExitParentMode() {
  const router = useRouter();

  async function exit() {
    await fetch("/api/auth/parent", { method: "DELETE" });
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={exit}
      className="rounded-full bg-surface-2 px-4 py-2 text-sm font-bold text-text-muted"
    >
      Exit parent mode
    </button>
  );
}
