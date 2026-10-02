"use client";

import { useState } from "react";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "Enter"] as const;

export function PinPad({
  title,
  subtitle,
  submitUrl,
  onSuccess,
}: {
  title: string;
  subtitle?: string;
  submitUrl: string;
  onSuccess: () => void;
}) {
  const [digits, setDigits] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(pin: string) {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(submitUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "Something went wrong.");
        setDigits("");
        return;
      }
      onSuccess();
    } catch {
      setError("Couldn't reach the server. Try again.");
      setDigits("");
    } finally {
      setSubmitting(false);
    }
  }

  function press(key: string) {
    if (submitting) return;
    if (key === "⌫") {
      setDigits((d) => d.slice(0, -1));
      return;
    }
    if (key === "Enter") {
      if (digits.length >= 4) void submit(digits);
      return;
    }
    setError(null);
    setDigits((d) => (d.length < 6 ? d + key : d));
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-column bg-surface p-8 shadow-card">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-[32px] font-extrabold">{title}</h1>
        {subtitle && <p className="text-lg text-text-muted">{subtitle}</p>}
      </div>

      <div className="flex gap-3" aria-live="polite" aria-label={`${digits.length} of up to 6 digits entered`}>
        {Array.from({ length: 6 }).map((_, i) => (
          <span
            key={i}
            className={`h-4 w-4 rounded-full border-2 border-line ${i < digits.length ? "bg-star" : "bg-transparent"}`}
          />
        ))}
      </div>

      {error && <p className="text-lg font-semibold text-danger">{error}</p>}

      <div className="grid grid-cols-3 gap-3">
        {KEYS.map((key) => (
          <button
            key={key}
            type="button"
            disabled={submitting || (key === "Enter" && digits.length < 4)}
            onClick={() => press(key)}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-2 text-2xl font-bold text-text transition-colors active:bg-line disabled:opacity-40"
          >
            {key}
          </button>
        ))}
      </div>
    </div>
  );
}
