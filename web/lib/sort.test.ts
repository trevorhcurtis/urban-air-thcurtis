import { describe, expect, it } from "vitest";
import { sortItems } from "./sort";

const rows = [
  { n: "UA102", price: 300, time: "09:00" },
  { n: "UA101", price: 100, time: "21:00" },
  { n: "UA110", price: 200, time: "06:30" },
];
const accessors = { price: (r: (typeof rows)[number]) => r.price, n: (r: (typeof rows)[number]) => r.n };

describe("sortItems", () => {
  it("sorts numbers ascending and descending", () => {
    expect(sortItems(rows, { key: "price", dir: "asc" }, accessors).map((r) => r.price)).toEqual([100, 200, 300]);
    expect(sortItems(rows, { key: "price", dir: "desc" }, accessors).map((r) => r.price)).toEqual([300, 200, 100]);
  });

  it("sorts text with natural number ordering", () => {
    expect(sortItems(rows, { key: "n", dir: "asc" }, accessors).map((r) => r.n)).toEqual(["UA101", "UA102", "UA110"]);
  });

  it("does not mutate the input and ignores unknown keys", () => {
    const copy = [...rows];
    sortItems(rows, { key: "price", dir: "desc" }, accessors);
    expect(rows).toEqual(copy);
    expect(sortItems(rows, { key: "missing", dir: "asc" }, accessors)).toBe(rows);
  });
});
