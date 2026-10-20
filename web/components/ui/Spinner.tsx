/** Loading indicator. The label is announced to screen readers. */
export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <span role="status" className="inline-flex items-center gap-2 text-sm text-text-primary">
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 motion-safe:animate-spin" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <span>{label}</span>
    </span>
  );
}
