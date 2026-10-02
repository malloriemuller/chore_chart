"use client";

import { useState } from "react";
import { PinPad } from "./PinPad";

export function RedeemModal({
  rewardName,
  profileName,
  rewardId,
  profileId,
  onClose,
  onRedeemed,
}: {
  rewardName: string;
  profileName: string;
  rewardId: string;
  profileId: string;
  onClose: () => void;
  onRedeemed: () => void;
}) {
  const [status, setStatus] = useState<"pin" | "redeeming" | "error">("pin");
  const [error, setError] = useState<string | null>(null);

  async function confirmParentPin() {
    setStatus("redeeming");
    try {
      const response = await fetch("/api/redemptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardId, profileId }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "Couldn't redeem that.");
        setStatus("error");
        return;
      }
      onRedeemed();
    } catch {
      setError("Couldn't reach the server.");
      setStatus("error");
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-column bg-surface p-6 shadow-card">
        {status === "pin" && (
          <>
            <p className="text-center text-lg text-text-muted">
              Redeem <span className="font-bold text-text">{rewardName}</span> for{" "}
              <span className="font-bold text-text">{profileName}</span>?
            </p>
            <PinPad
              title="Parent Mode"
              subtitle="Enter the parent PIN to confirm"
              submitUrl="/api/auth/parent"
              onSuccess={confirmParentPin}
            />
          </>
        )}
        {status === "redeeming" && <p className="text-lg text-text-muted">Redeeming…</p>}
        {status === "error" && (
          <>
            <p className="text-lg font-semibold text-danger">{error}</p>
            <button
              type="button"
              onClick={() => setStatus("pin")}
              className="rounded-full bg-surface-2 px-5 py-3 text-lg font-bold"
            >
              Try again
            </button>
          </>
        )}
        <button type="button" onClick={onClose} className="text-base font-bold text-text-muted">
          Cancel
        </button>
      </div>
    </div>
  );
}
