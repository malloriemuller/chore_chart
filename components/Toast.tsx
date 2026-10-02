"use client";

export function Toast({
  message,
  actionLabel,
  onAction,
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-24 z-30 flex justify-center px-4">
      <div className="flex items-center gap-4 rounded-full bg-[#2E2A25] px-5 py-3 text-white shadow-card">
        <span className="text-base font-semibold">{message}</span>
        {actionLabel && onAction && (
          <button type="button" onClick={onAction} className="text-base font-extrabold text-star">
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
