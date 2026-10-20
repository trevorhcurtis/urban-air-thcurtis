"use client";

export type SortKey = { key: string; label: string };
export type SortState = { key: string; dir: "asc" | "desc" };

/** Sort control for lists and tables. Works the same with a mouse, touch, or keyboard. */
export function SortBar({
  keys,
  value,
  onChange,
  label = "Sort by",
}: {
  keys: SortKey[];
  value: SortState;
  onChange: (next: SortState) => void;
  label?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <label htmlFor="sort-key" className="font-medium text-text-primary">{label}</label>
      <select
        id="sort-key"
        value={value.key}
        onChange={(e) => onChange({ ...value, key: e.target.value })}
        className="rounded-md border border-border-default bg-surface-canvas px-3 py-2"
      >
        {keys.map((k) => (
          <option key={k.key} value={k.key}>{k.label}</option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => onChange({ ...value, dir: value.dir === "asc" ? "desc" : "asc" })}
        className="rounded-md border border-border-default bg-surface-canvas px-3 py-2 min-h-control-md"
        aria-label={`Sort direction: ${value.dir === "asc" ? "ascending" : "descending"}. Toggle`}
      >
        {value.dir === "asc" ? "Ascending" : "Descending"}
      </button>
    </div>
  );
}
