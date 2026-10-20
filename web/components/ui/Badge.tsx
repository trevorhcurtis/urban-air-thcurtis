import type { ReactNode } from "react";

export type BadgeTone = "neutral" | "info" | "success" | "warning" | "error";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-surface-brand text-text-primary",
  info: "bg-surface-info text-text-info",
  success: "bg-surface-success text-text-success",
  warning: "bg-surface-warning text-text-warning",
  error: "bg-surface-error text-text-error",
};

export const BADGE_TONES = Object.keys(tones) as BadgeTone[];

/** Short status label. The text says the status; the color only supports it. */
export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}
