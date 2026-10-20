"use client";

import type { ApiIssue } from "@/lib/api/client";
import { Alert } from "./Alert";
import { Button } from "./Button";

/**
 * Shows a simulated system issue from the API in customer-facing language.
 * Retry appears only when the issue allows it.
 */
export function IssueBanner({ issue, onRetry, retrying = false }: { issue: ApiIssue; onRetry?: () => void; retrying?: boolean }) {
  if (!issue) return null;
  const tone = issue.blocking ? "error" : "warning";

  return (
    <div className="space-y-3">
      <Alert tone={tone} title={issue.title}>
        <p>{issue.message}</p>
        <p className="mt-2 text-xs text-text-muted">
          Reference: {issue.code}{issue.request_id ? ` · ${issue.request_id}` : ""}
        </p>
      </Alert>
      {issue.retry_allowed && onRetry && (
        <Button variant="secondary" onClick={onRetry} loading={retrying}>
          Try again
        </Button>
      )}
    </div>
  );
}
