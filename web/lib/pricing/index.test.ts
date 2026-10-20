import { describe, expect, it } from "vitest";
import { breakdown, FEE_PER_PASSENGER_CENTS, TAX_RATE } from "./index";

describe("breakdown", () => {
  it("sums base, taxes, and fees so the total matches the line items", () => {
    const result = breakdown([{ price_cents: 20000 }, { price_cents: 10000 }], 2);

    expect(result.base).toBe(60000);
    expect(result.taxes).toBe(Math.round(60000 * TAX_RATE));
    expect(result.fees).toBe(2 * 2 * FEE_PER_PASSENGER_CENTS);
    expect(result.total).toBe(result.base + result.taxes + result.fees);
  });

  it("charges fees once per leg per passenger", () => {
    expect(breakdown([{ price_cents: 0 }], 3).fees).toBe(3 * FEE_PER_PASSENGER_CENTS);
  });
});
