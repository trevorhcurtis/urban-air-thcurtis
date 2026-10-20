/**
 * Placeholder while content loads. Pulses only when the traveler allows motion.
 * Variants match the shapes they stand in for: a line of text, a card, an image, or a table row.
 */
const variants = {
  text: "h-4 w-full",
  card: "h-40 w-full rounded-lg",
  image: "aspect-video w-full rounded-lg",
  row: "h-12 w-full",
} as const;

export const SKELETON_VARIANTS = Object.keys(variants) as (keyof typeof variants)[];

export function Skeleton({ variant = "text", className = "" }: { variant?: keyof typeof variants; className?: string }) {
  return <div aria-hidden="true" className={`rounded bg-border-subtle/50 motion-safe:animate-pulse ${variants[variant]} ${className}`} />;
}
