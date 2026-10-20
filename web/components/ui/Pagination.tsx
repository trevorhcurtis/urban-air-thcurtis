"use client";

import { Button } from "./Button";

/** Page controls. The current page has aria-current, and unavailable directions are disabled. */
export function Pagination({ page, pageCount, onPageChange, label = "Pagination" }: { page: number; pageCount: number; onPageChange: (page: number) => void; label?: string }) {
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);
  return (
    <nav aria-label={label} className="flex flex-wrap items-center gap-2">
      <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        Previous
      </Button>
      <ol className="flex flex-wrap items-center gap-1">
        {pages.map((p) => (
          <li key={p}>
            <Button
              variant={p === page ? "primary" : "ghost"}
              size="sm"
              aria-current={p === page ? "page" : undefined}
              aria-label={`Page ${p}`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </Button>
          </li>
        ))}
      </ol>
      <Button variant="secondary" size="sm" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>
        Next
      </Button>
    </nav>
  );
}
