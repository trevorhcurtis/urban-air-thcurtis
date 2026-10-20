import { Stepper } from "@/components/booking/Stepper";
import { StepIssuesProvider } from "@/components/booking/StepIssues";
import { PerRequest } from "@/components/layout/PerRequest";

/** Booking pages depend on each visitor's cookies, so they render per request. */
export default function BookLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pt-8">
      <StepIssuesProvider>
        <Stepper />
        <PerRequest fallback={<p role="status" className="py-10 text-text-muted">Loading…</p>}>{children}</PerRequest>
      </StepIssuesProvider>
    </div>
  );
}
