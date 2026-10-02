export function ErrorState({
  message = "Something went wrong loading this page.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-lg font-semibold text-danger">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="rounded-full bg-surface-2 px-5 py-3 text-lg font-bold">
          Try again
        </button>
      )}
    </div>
  );
}
