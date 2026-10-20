export const AVATAR_SIZES = ["sm", "md", "lg"] as const;

/** Initials fallback, or the image when a src is given. The name is always the accessible label. */
export function Avatar({ name, src, size = "md" }: { name: string; src?: string; size?: "sm" | "md" | "lg" }) {
  const dimension = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-14 w-14 text-lg" }[size];
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element -- avatars are small, decorative-sized images from the app itself
    return <img src={src} alt={name} className={`${dimension} rounded-full object-cover`} />;
  }
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <span role="img" aria-label={name} className={`inline-flex ${dimension} items-center justify-center rounded-full bg-surface-brand font-semibold text-text-primary`}>
      <span aria-hidden="true">{initials}</span>
    </span>
  );
}
