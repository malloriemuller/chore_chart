"use client";

import { useRouter } from "next/navigation";
import { PinPad } from "./PinPad";

export function PinUnlock({ next }: { next: string }) {
  const router = useRouter();

  return (
    <PinPad
      title="Chore Board"
      subtitle="Enter the household PIN"
      submitUrl="/api/auth/household"
      onSuccess={() => {
        router.push(next);
        router.refresh();
      }}
    />
  );
}
