import type { ReactNode } from "react";

/** Surface for grouping related content: itineraries, tiers, partner tiles. Decorative border, card elevation. */
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-border-subtle bg-surface-canvas p-5 shadow-card ${className}`}>{children}</div>;
}
