"use client";

import { useRouter } from "next/navigation";
import { PinPad } from "./PinPad";

export function ParentUnlock() {
  const router = useRouter();

  return (
    <PinPad
      title="Parent Mode"
      subtitle="Enter the parent PIN"
      submitUrl="/api/auth/parent"
      onSuccess={() => router.refresh()}
    />
  );
}
