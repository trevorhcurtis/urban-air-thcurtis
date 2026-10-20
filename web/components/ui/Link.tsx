import NextLink from "next/link";
import type { ReactNode } from "react";

/** Text link. Underlined so it is not identified by color alone. */
export function TextLink({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return (
    <NextLink href={href} className={`rounded-sm text-text-link underline underline-offset-4 hover:no-underline ${className}`}>
      {children}
    </NextLink>
  );
}
