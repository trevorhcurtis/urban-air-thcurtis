export const DIVIDER_ORIENTATIONS = ["horizontal", "vertical"] as const;
export const DIVIDER_WEIGHTS = ["subtle", "strong"] as const;

/** Separator. Subtle is decorative; strong is for structure that needs a visible boundary. */
export function Divider({ orientation = "horizontal", weight = "subtle", className = "" }: { orientation?: "horizontal" | "vertical"; weight?: "subtle" | "strong"; className?: string }) {
  const color = weight === "strong" ? "bg-border-default" : "bg-border-subtle";
  return orientation === "vertical" ? (
    <div role="separator" aria-orientation="vertical" className={`w-px self-stretch ${color} ${className}`} />
  ) : (
    <div role="separator" aria-orientation="horizontal" className={`h-px w-full ${color} ${className}`} />
  );
}
