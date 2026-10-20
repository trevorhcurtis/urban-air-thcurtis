"use client";

import { useMemo, useState } from "react";
import { SortBar, type SortState } from "@/components/ui/SortBar";
import { Tooltip } from "@/components/ui/Tooltip";
import { sortItems } from "@/lib/sort";

type Partner = { id: number; name: string; category: string; description: string; logo_key: string };

const SORT_KEYS = [
  { key: "name", label: "Name" },
  { key: "category", label: "Category" },
];

const ACCESSORS = {
  name: (p: Partner) => p.name,
  category: (p: Partner) => p.category,
};

export function PartnersList({ partners }: { partners: Partner[] }) {
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState<SortState>({ key: "name", dir: "asc" });

  const categories = useMemo(() => ["All", ...new Set(partners.map((p) => p.category))], [partners]);
  const visible = useMemo(() => {
    const filtered = category === "All" ? partners : partners.filter((p) => p.category === category);
    return sortItems(filtered, sort, ACCESSORS);
  }, [partners, category, sort]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by category">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
              className={`min-h-control-md rounded-full border px-4 text-sm font-medium ${
                category === c ? "border-border-interactive bg-surface-interactive text-text-inverse" : "border-border-default bg-surface-canvas text-text-primary hover:bg-surface-brand"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <SortBar keys={SORT_KEYS} value={sort} onChange={setSort} />
      </div>

      <ul className="grid gap-4 md:grid-cols-2">
        {visible.map((p) => (
          <li key={p.id} className="rounded-lg border border-border-subtle p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-text-primary">
                  <Tooltip content={`${p.name} is a partner in the ${p.category.toLowerCase()} category.`}>{p.name}</Tooltip>
                </p>
                <p className="mt-1 text-sm text-text-muted">{p.category}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-text-primary">{p.description}</p>
          </li>
        ))}
      </ul>
      {visible.length === 0 && <p className="text-text-muted">No partners in this category yet.</p>}
    </div>
  );
}
