"use client";

import type { ReactNode } from "react";
import { Button } from "./Button";
import { Dialog } from "./Dialog";

export const DRAWER_SIDES = ["right", "left"] as const;

/**
 * Side panel for navigation and secondary tasks. Same focus, Esc, and backdrop behavior as Modal.
 * It always has a visible close button, so a keyboard user can leave without knowing Esc.
 */
export function Drawer({
  open,
  title,
  onClose,
  side = "right",
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  side?: "right" | "left";
  children: ReactNode;
}) {
  return (
    <Dialog
      open={open}
      title={title}
      onClose={onClose}
      placement={side}
      headerAction={
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      }
    >
      {children}
    </Dialog>
  );
}
