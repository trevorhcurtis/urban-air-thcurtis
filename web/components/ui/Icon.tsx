import type { ReactNode } from "react";

/** Icon sizes from the guidance: 16, 20, 24, and 32px. Decorative by default. Pass a label to make it meaningful. */
const sizes = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-6 w-6", xl: "h-8 w-8" } as const;

export const ICON_SIZES = Object.keys(sizes) as (keyof typeof sizes)[];

export function Icon({ size = "md", label, className = "", children }: { size?: keyof typeof sizes; label?: string; className?: string; children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${sizes[size]} shrink-0 ${className}`}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {children}
    </svg>
  );
}
