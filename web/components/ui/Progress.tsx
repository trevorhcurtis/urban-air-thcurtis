/** Determinate when value is given, indeterminate otherwise. Always labeled for screen readers. */
export function Progress({ label, value, max = 100 }: { label: string; value?: number; max?: number }) {
  const determinate = typeof value === "number";
  const percent = determinate ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={determinate ? value : undefined}
      className="h-2 w-full overflow-hidden rounded-full bg-surface-muted"
    >
      <div
        className={`h-full rounded-full bg-surface-interactive transition-all duration-standard motion-reduce:transition-none ${determinate ? "" : "w-1/3 motion-safe:animate-pulse"}`}
        style={determinate ? { width: `${percent}%` } : undefined}
      />
    </div>
  );
}
