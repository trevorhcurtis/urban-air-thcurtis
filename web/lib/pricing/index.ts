/**
 * Prototype price breakdown. Taxes are 7.5 percent of base fare, and carrier fees are a flat
 * $12.50 per passenger per leg. Values are whole cents.
 */
export const TAX_RATE = 0.075;
export const FEE_PER_PASSENGER_CENTS = 1250;

export type Breakdown = { base: number; taxes: number; fees: number; total: number };

export function breakdown(legs: { price_cents: number }[], passengers: number): Breakdown {
  const base = legs.reduce((sum, leg) => sum + leg.price_cents * passengers, 0);
  const taxes = Math.round(base * TAX_RATE);
  const fees = legs.length * passengers * FEE_PER_PASSENGER_CENTS;
  return { base, taxes, fees, total: base + taxes + fees };
}
