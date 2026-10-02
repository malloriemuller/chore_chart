"use client";

import { Check } from "lucide-react";

export function Checkbox({
  checked,
  disabled = false,
  onToggle,
  label,
}: {
  checked: boolean;
  disabled?: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[2.5px] transition-colors disabled:opacity-40"
      style={{
        borderColor: "var(--profile-base)",
        backgroundColor: checked ? "var(--profile-base)" : "transparent",
      }}
    >
      {checked && <Check key="check" className="h-7 w-7 animate-checkbox-spring text-white" strokeWidth={3} />}
    </button>
  );
}
