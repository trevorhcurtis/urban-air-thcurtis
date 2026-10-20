"use client";

import { type ReactNode, useEffect, useId, useRef, useState } from "react";

/**
 * Hover on desktop, tap on touch. Esc or an outside tap closes it.
 * The trigger is focusable, so keyboard users get the same content on focus.
 */
export function Tooltip({ content, children }: { content: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const wrapper = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (wrapper.current && !wrapper.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  return (
    <span
      ref={wrapper}
      className="relative inline-flex"
      onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setOpen(false)}
      onClick={(e) => {
        // A touch tap opens it. Closing happens on an outside tap or Esc, so focus and tap don't fight.
        if ((e.nativeEvent as PointerEvent).pointerType !== "mouse") setOpen(true);
      }}
      onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
    >
      <span
        tabIndex={0}
        aria-describedby={open ? id : undefined}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="cursor-help underline decoration-dotted underline-offset-4"
      >
        {children}
      </span>
      {open && (
        <span
          role="tooltip"
          id={id}
          className="absolute bottom-full left-1/2 z-20 mb-2 w-64 -translate-x-1/2 rounded-md bg-surface-inverse p-3 text-left text-sm text-text-inverse shadow-popover"
        >
          {content}
        </span>
      )}
    </span>
  );
}
