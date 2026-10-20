import type { SortState } from "@/components/ui/SortBar";

/** Returns a new array sorted by the chosen key. Strings compare naturally, so "UA101" sorts before "UA102". */
export function sortItems<T>(items: T[], sort: SortState, accessors: Record<string, (item: T) => string | number>): T[] {
  const read = accessors[sort.key];
  if (!read) return items;
  const factor = sort.dir === "asc" ? 1 : -1;

  return [...items].sort((a, b) => {
    const x = read(a);
    const y = read(b);
    if (typeof x === "number" && typeof y === "number") return (x - y) * factor;
    return String(x).localeCompare(String(y), "en", { numeric: true }) * factor;
  });
}
