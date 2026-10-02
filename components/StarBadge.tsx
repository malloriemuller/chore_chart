"use client";

import { useCountUp } from "@/lib/hooks/useCountUp";

export function StarBadge({ value, tone = "default" }: { value: number; tone?: "default" | "onColor" }) {
  const displayed = useCountUp(value);
  const toneClasses = tone === "onColor" ? "bg-white text-text" : "bg-surface-2 text-text";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[16px] font-extrabold ${toneClasses}`}>
      <span aria-hidden className="text-star">
        ★
      </span>
      {displayed}
    </span>
  );
}
