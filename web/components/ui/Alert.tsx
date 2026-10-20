import type { ReactNode } from "react";

export type Tone = "info" | "success" | "warning" | "error";

/** Each tone pairs a surface, a solid edge, and text. Color is never the only signal: every alert has a title and icon. */
export const tones: Record<Tone, string> = {
  info: "border-solid-info bg-surface-info",
  success: "border-solid-success bg-surface-success",
  warning: "border-solid-warning bg-surface-warning",
  error: "border-solid-error bg-surface-error",
};

export const ALERT_TONES = Object.keys(tones) as Tone[];

const toneIcon: Record<Tone, ReactNode> = {
  info: <path d="M8 7v5M8 4.5v.5" />,
  success: <path d="M4.5 8.5l2.25 2.25L11.5 5.5" />,
  warning: <path d="M8 4.5v4.5M8 11.25v.25" />,
  error: <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" />,
};

export function ToneIcon({ tone }: { tone: Tone }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="mt-0.5 h-5 w-5 shrink-0 text-text-primary" fill="none">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
      <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        {toneIcon[tone]}
      </g>
    </svg>
  );
}

export function Alert({ tone = "info", title, children }: { tone?: Tone; title?: string; children?: ReactNode }) {
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`flex gap-3 rounded-md border border-l-4 p-4 text-text-primary ${tones[tone]}`}>
      <ToneIcon tone={tone} />
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="text-sm">{children}</div>}
      </div>
    </div>
  );
}
