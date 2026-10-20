"use client";

import { usePathname } from "next/navigation";
import { useStepIssues } from "./StepIssues";

const STEPS = [
  { path: "/book/search", label: "Search" },
  { path: "/book/flights", label: "Flights" },
  { path: "/book/passengers", label: "Passengers" },
  { path: "/book/seats", label: "Seats" },
  { path: "/book/review", label: "Review & pay" },
  { path: "/book/confirmation", label: "Confirmed" },
];

/**
 * Progress across the booking flow. The current step gets aria-current. A step that needs attention
 * shows the words "Needs attention" and the issue, so the state never depends on color alone.
 */
export function Stepper() {
  const pathname = usePathname();
  const issues = useStepIssues();
  const current = STEPS.findIndex((s) => pathname.startsWith(s.path));

  return (
    <nav aria-label="Booking progress" className="mb-8">
      <ol className="grid grid-cols-3 gap-2 text-sm md:grid-cols-6">
        {STEPS.map((step, index) => {
          const done = current > index;
          const isCurrent = index === current;
          const issue = issues[index];
          return (
            <li key={step.path} className="flex flex-col gap-2" aria-current={isCurrent ? "step" : undefined}>
              <span className={`h-1.5 rounded-full ${issue ? "bg-solid-error" : done || isCurrent ? "bg-surface-interactive" : "bg-border-subtle"}`} aria-hidden="true" />
              <span className={`flex items-center gap-1.5 ${issue ? "font-semibold text-text-error" : isCurrent ? "font-semibold text-text-primary" : done ? "text-text-primary" : "text-text-muted"}`}>
                <span
                  aria-hidden="true"
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                    issue ? "bg-surface-destructive text-text-inverse" : done ? "bg-surface-accent text-text-on-accent" : isCurrent ? "bg-surface-interactive text-text-inverse" : "bg-surface-brand text-text-primary"
                  }`}
                >
                  {issue ? "!" : done ? "✓" : index + 1}
                </span>
                {step.label}
                {issue && (
                  <>
                    <span className="text-xs font-medium text-text-error">Needs attention</span>
                    <span className="sr-only">: {issue}</span>
                  </>
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
