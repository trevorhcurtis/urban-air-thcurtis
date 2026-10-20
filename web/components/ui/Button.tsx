import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "soft" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg" | "xl";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md px-5 font-semibold transition-colors duration-standard " +
  "disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-surface-interactive text-text-inverse hover:bg-surface-interactive-hover active:bg-surface-interactive-pressed",
  secondary: "border border-border-brand bg-surface-canvas text-text-primary hover:bg-surface-brand active:bg-surface-brand-hover",
  soft: "bg-surface-brand text-text-primary hover:bg-surface-brand-hover active:bg-surface-brand-pressed",
  ghost: "text-text-link hover:bg-surface-brand active:bg-surface-brand-hover active:text-text-link-pressed",
  destructive: "bg-surface-destructive text-text-inverse hover:bg-surface-destructive-hover active:bg-surface-destructive-pressed",
};

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-control-sm px-3 text-sm",
  md: "min-h-control-md py-2 text-md",
  lg: "min-h-control-lg px-6 text-md",
  xl: "min-h-control-xl px-8 text-lg",
};

/** Variant and size names, as listed in Button.contract.json. */
export const BUTTON_VARIANTS = Object.keys(variants) as ButtonVariant[];
export const BUTTON_SIZES = Object.keys(sizes) as ButtonSize[];

/** Class string for a button look, for use on links as well as buttons. */
export function buttonClass({ variant = "primary", size = "md", className = "" }: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return `${base} ${sizes[size]} ${variants[variant]} ${className}`.trim();
}

/**
 * The one button. Loading keeps the label visible, adds a spinner, and blocks repeat presses.
 * Disabled is shown with cursor and opacity, and the label still explains the action.
 */
export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize; loading?: boolean; children: ReactNode }) {
  return (
    <button className={buttonClass({ variant, size, className })} disabled={props.disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading && (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 motion-safe:animate-spin" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  children,
  className = "",
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={buttonClass({ variant, size, className })}>
      {children}
    </Link>
  );
}
