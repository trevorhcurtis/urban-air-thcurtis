"use client";

import { type KeyboardEvent, type ReactNode, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { Heading } from "./Heading";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export type DialogPlacement = "center" | "right" | "left";

const frame: Record<DialogPlacement, string> = {
  center: "fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4",
  right: "fixed inset-0 z-50 flex justify-end",
  left: "fixed inset-0 z-50 flex justify-start",
};

const panel: Record<DialogPlacement, string> = {
  center: "relative w-full max-w-lg rounded-t-xl bg-surface-canvas p-6 shadow-modal sm:rounded-xl",
  right: "relative flex h-full w-full max-w-sm flex-col overflow-y-auto bg-surface-canvas p-6 shadow-modal",
  left: "relative flex h-full w-full max-w-sm flex-col overflow-y-auto bg-surface-canvas p-6 shadow-modal",
};

/**
 * Shared dialog core for Modal and Drawer. Focus moves in on open and returns to the element that
 * opened it on close. Tab and Shift+Tab wrap inside the dialog. Esc closes it. A tap or click on the
 * backdrop closes it too. The dialog renders into document.body, so a backdrop-filter on a parent
 * (the site header) can't clip it.
 */
export function Dialog({
  open,
  title,
  onClose,
  placement = "center",
  headerAction,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  placement?: DialogPlacement;
  headerAction?: ReactNode;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const returnTo = document.activeElement as HTMLElement | null;
    (panelRef.current?.querySelector<HTMLElement>(FOCUSABLE) ?? panelRef.current)?.focus();
    return () => returnTo?.focus();
  }, [open]);

  if (!open) return null;

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== "Tab" || !panelRef.current) return;

    // Keep Tab and Shift+Tab inside the dialog by wrapping at both ends.
    const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return createPortal(
    <div className={frame[placement]}>
      <div className="absolute inset-0 bg-surface-inverse/50" aria-hidden="true" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className={panel[placement]}
      >
        <div className="flex items-start justify-between gap-4">
          <Heading level={2} size={4} id={titleId}>{title}</Heading>
          {headerAction}
        </div>
        <div className="mt-4 min-h-0 flex-1">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
