"use client";

import type { ReactNode } from "react";
import { Dialog } from "./Dialog";

/** Centered dialog (a bottom sheet on phones). Focus trap, Esc, and backdrop close. See Dialog. */
export function Modal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  return (
    <Dialog open={open} title={title} onClose={onClose} placement="center">
      {children}
    </Dialog>
  );
}
