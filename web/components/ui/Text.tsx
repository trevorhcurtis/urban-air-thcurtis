import { createElement, type ReactNode } from "react";

/** Body copy in the scale from the guidance. Pick the role, not the size. */
const roles = {
  lead: "text-lg text-text-primary",
  body: "text-md text-text-primary",
  label: "text-sm font-medium text-text-primary",
  helper: "text-sm text-text-muted",
  meta: "text-xs text-text-muted",
} as const;

export const TEXT_ROLES = Object.keys(roles) as (keyof typeof roles)[];

export function Text({
  role = "body",
  as = "p",
  id,
  className = "",
  children,
}: {
  role?: keyof typeof roles;
  as?: "p" | "span" | "div";
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return createElement(as, { id, className: `${roles[role]} ${className}` }, children);
}
