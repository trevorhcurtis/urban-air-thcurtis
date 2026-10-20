"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Logo } from "./Logo";

const NAV = [
  { href: "/book/search", label: "Book" },
  { href: "/profile", label: "Trips & Profile" },
  { href: "/rewards", label: "Rewards" },
  { href: "/partners", label: "Partners" },
];

/** Universal header. Desktop shows inline links. Smaller screens use a menu button and drawer. */
export function SiteHeader() {
  const pathname = usePathname();
  // Storing the path the drawer was opened on means navigating away closes it without an effect.
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;
  const setOpen = (next: boolean) => setOpenPath(next ? pathname : null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenPath(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-border-subtle bg-surface-canvas/95 backdrop-blur">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:rounded focus:bg-surface-canvas focus:p-2">
        Skip to content
      </a>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Logo />

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={pathname.startsWith(item.href) ? "page" : undefined}
                  className="rounded-md px-3 py-2 text-sm font-medium text-text-primary hover:bg-surface-brand aria-[current=page]:text-text-link"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <button
          type="button"
          className="inline-flex min-h-control-md min-w-11 items-center justify-center rounded-md border border-border-default md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen(!open)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <svg viewBox="0 0 24 24" className="h-6 w-6 text-text-primary" aria-hidden="true">
            {open ? <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" /> : <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" />}
          </svg>
        </button>
      </div>

      <Drawer open={open} title="Menu" onClose={() => setOpen(false)}>
        <nav id="mobile-nav" aria-label="Mobile">
          <ul className="flex flex-col gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="block rounded-md px-3 py-3 text-md font-medium text-text-primary hover:bg-surface-brand">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Drawer>
    </header>
  );
}
