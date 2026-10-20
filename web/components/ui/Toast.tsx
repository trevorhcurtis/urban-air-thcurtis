"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { type Tone, tones } from "./Alert";

/**
 * Short, non-blocking message for simulated issues that don't stop the flow. Errors use an
 * alert role so screen readers announce them at once. Other tones use a polite status.
 * Pass autoDismissMs to hide it after a delay, and always keep a dismiss button for people who need more time.
 */
export function Toast({
  tone = "info",
  title,
  children,
  onDismiss,
  autoDismissMs,
}: {
  tone?: Tone;
  title: string;
  children?: ReactNode;
  onDismiss: () => void;
  autoDismissMs?: number;
}) {
  // Keep the latest callback in a ref so an inline function from the parent doesn't restart the timer.
  const dismiss = useRef(onDismiss);
  useEffect(() => {
    dismiss.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!autoDismissMs) return;
    const timer = setTimeout(() => dismiss.current(), autoDismissMs);
    return () => clearTimeout(timer);
  }, [autoDismissMs]);

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-md border-l-4 bg-surface-canvas p-4 shadow-popover ${tones[tone]}`}
    >
      <div className="flex-1">
        <p className="font-semibold">{title}</p>
        {children && <div className="text-sm">{children}</div>}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label={`Dismiss: ${title}`}
        className="min-h-control-md min-w-11 rounded-md px-2 text-lg leading-none text-text-primary hover:bg-surface-brand"
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  );
}
