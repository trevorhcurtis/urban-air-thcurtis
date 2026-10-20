import type { ReactNode } from "react";
import { Heading } from "./Heading";

/** Nothing to show yet. Explain why, and offer one way forward. */
export function EmptyState({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="flex flex-col items-start gap-3 rounded-lg border border-dashed border-border-default bg-surface-subtle p-6">
      <Heading level={3}>{title}</Heading>
      <div className="text-md text-text-secondary">{children}</div>
      {action}
    </section>
  );
}
