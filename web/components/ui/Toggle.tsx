"use client";

import type { ReactNode } from "react";

/**
 * On/off switch with an explicit state and accessible name. Uses role="switch" on a native button,
 * so Space and Enter work from the keyboard and a tap works on touch.
 */
export function Toggle({
  checked,
  onChange,
  children,
  disabled = false,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="inline-flex min-h-11 items-center gap-3 text-left text-sm text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span
        aria-hidden="true"
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-standard motion-reduce:transition-none ${
          checked ? "border-border-interactive bg-surface-interactive" : "border-border-default bg-surface-canvas"
        }`}
      >
        <span className={`h-4 w-4 rounded-full transition-transform duration-standard motion-reduce:transition-none ${checked ? "translate-x-6 bg-surface-canvas" : "translate-x-1 bg-border-default"}`} />
      </span>
      <span>{children}</span>
      <span className="sr-only">{checked ? "On" : "Off"}</span>
    </button>
  );
}
