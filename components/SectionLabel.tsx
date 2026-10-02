export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="shrink-0 text-[14px] font-bold uppercase tracking-[0.06em] text-text-muted">
        {children}
      </span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
