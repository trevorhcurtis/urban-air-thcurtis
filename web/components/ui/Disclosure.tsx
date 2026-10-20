import type { ReactNode } from "react";

/**
 * Accordion item on native details and summary, so keyboard and touch work with no JavaScript.
 * The summary is at least 44px tall. The + turns into an x when expanded, and the turn is skipped
 * under reduced motion. The focus outline comes from the global focus-visible rule.
 */
export function Disclosure({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="group rounded-md border border-border-default bg-surface-canvas p-4 open:bg-surface-brand/40">
      <summary className="flex min-h-control-md cursor-pointer list-none items-center font-semibold text-text-primary marker:hidden hover:text-text-link">
        <span className="flex w-full items-center justify-between gap-4">
          {title}
          <span aria-hidden="true" className="text-h4 leading-none transition-transform duration-standard group-open:rotate-45 motion-reduce:transition-none">+</span>
        </span>
      </summary>
      <div className="mt-3 text-sm text-text-primary">{children}</div>
    </details>
  );
}
