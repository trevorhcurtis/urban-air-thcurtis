import { createElement, type ReactNode } from "react";

type Level = 1 | 2 | 3 | 4;

type HeadingProps = {
  /** Document outline. Pick the level that fits the page structure. */
  level: Level;
  /** Visual size, when it should differ from the level. Booking pages use a level 1 title at the h2 size. */
  size?: Level;
  brand?: boolean;
  id?: string;
  className?: string;
  children: ReactNode;
};

// Level 1 steps down on phones (40px) and rises to the desktop hero size (48px) from md.
const sizes = { 1: "text-h1-mobile md:text-h1", 2: "text-h2", 3: "text-h3", 4: "text-h4" } as const;

export const HEADING_SIZES = Object.keys(sizes) as unknown as Level[];

/**
 * Headings use Inter SemiBold. Only brand moments use the brand face (Sora ExtraBold),
 * and only at level 1 or 2 with the brand prop set. Booking and account headings never use Sora.
 */
export function Heading({ level, size, brand = false, id, className = "", children }: HeadingProps) {
  if (brand && level > 2) throw new Error("Only level 1 and 2 headings can use the brand face");
  const weight = brand ? "font-brand font-extrabold tracking-tight" : "font-ui font-semibold";
  // A caller that sets its own text color (for example on a dark hero) keeps it. Otherwise the heading uses primary text.
  const color = /(^|\s)text-text-(primary|secondary|muted|link|inverse|on-accent|accent|success|warning|error|info)\b/.test(className) ? "" : "text-text-primary";
  return createElement(
    `h${level}`,
    { id, className: `${sizes[size ?? level]} ${weight} ${color} ${className}`.replace(/\s+/g, " ").trim() },
    children,
  );
}
