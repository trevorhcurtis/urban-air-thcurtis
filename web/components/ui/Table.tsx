"use client";

import type { ReactNode } from "react";
import type { SortState } from "./SortBar";

export type Column<T> = {
  key: string;
  header: string;
  /** Adds a sort button to the header. The parent sorts the rows with lib/sort.ts. */
  sortable?: boolean;
  cell: (row: T) => ReactNode;
};

/**
 * Data table with sortable headers (aria-sort on the active column). On phones each row becomes a
 * stacked card with labeled values. Both views render from the same rows, and CSS shows one at a time.
 * The sort buttons only appear in the table view, so on phones the page supplies its own sort control (see SortBar).
 */
export function Table<T>({
  caption,
  columns,
  rows,
  rowKey,
  sort,
  onSortChange,
}: {
  caption: string;
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  sort: SortState;
  onSortChange: (next: SortState) => void;
}) {
  function toggleSort(key: string) {
    onSortChange(sort.key === key ? { key, dir: sort.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" });
  }

  return (
    <div>
      <table aria-label={caption} className="hidden w-full text-left text-sm text-text-primary md:table">
        <thead className="border-b border-border-subtle">
          <tr>
            {columns.map((col) => {
              const active = sort.key === col.key;
              const ariaSort = !col.sortable ? undefined : active ? (sort.dir === "asc" ? "ascending" : "descending") : "none";
              return (
                <th key={col.key} scope="col" aria-sort={ariaSort} className="px-3 py-2 font-semibold">
                  {col.sortable ? (
                    <button type="button" onClick={() => toggleSort(col.key)} className="inline-flex min-h-control-md items-center gap-1">
                      {col.header}
                      <span aria-hidden="true">{active ? (sort.dir === "asc" ? "▲" : "▼") : "↕"}</span>
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-b border-border-subtle/60">
              {columns.map((col) => (
                <td key={col.key} className="px-3 py-3 align-top">{col.cell(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <ul aria-label={caption} className="space-y-3 md:hidden">
        {rows.map((row) => (
          <li key={rowKey(row)} className="rounded-lg border border-border-subtle bg-surface-canvas p-4">
            <dl className="grid grid-cols-label gap-x-4 gap-y-2 text-sm text-text-primary">
              {columns.map((col) => (
                <div key={col.key} className="contents">
                  <dt className="font-semibold">{col.header}</dt>
                  <dd>{col.cell(row)}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
