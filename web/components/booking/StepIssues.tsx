"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

type Issues = Record<number, string>;
type Report = (index: number, message: string | null) => void;

const StepIssuesContext = createContext<{ issues: Issues; report: Report } | null>(null);

/**
 * Keeps which booking steps need attention, so the stepper can show an error state. Pages report
 * their own blocking issue with useStepIssue. Only blocking issues should be reported.
 */
export function StepIssuesProvider({ children }: { children: ReactNode }) {
  const [issues, setIssues] = useState<Issues>({});
  const report = useCallback<Report>((index, message) => {
    setIssues((prev) => {
      if (message === null) {
        if (!(index in prev)) return prev;
        const next = { ...prev };
        delete next[index];
        return next;
      }
      return prev[index] === message ? prev : { ...prev, [index]: message };
    });
  }, []);
  const value = useMemo(() => ({ issues, report }), [issues, report]);
  return <StepIssuesContext.Provider value={value}>{children}</StepIssuesContext.Provider>;
}

export function useStepIssues(): Issues {
  return useContext(StepIssuesContext)?.issues ?? {};
}

/** Marks a step as needing attention while `message` is set. Clears when the message changes or the page unmounts. */
export function useStepIssue(index: number, message: string | null) {
  const report = useContext(StepIssuesContext)?.report;
  useEffect(() => {
    if (!report) return;
    report(index, message);
    return () => report(index, null);
  }, [report, index, message]);
}
