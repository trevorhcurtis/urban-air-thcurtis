import Image from "next/image";
import Link from "next/link";

/** Urban Air logo mark, served from public/brand. Colors are baked into the SVG by the brand owner. */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2 rounded-md" aria-label="Urban Air home">
      <Image src="/brand/urban-air-logo.svg" alt="" aria-hidden="true" width={498} height={209} unoptimized className="h-8 w-auto" />
      {!compact && <span className="font-brand text-lg font-extrabold tracking-tight text-text-primary">Urban Air</span>}
    </Link>
  );
}
